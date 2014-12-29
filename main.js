var logger = require('dachshund-logger').getLogger(__filename);
var spawn = require('child_process').spawn;
var readline = require('readline');
var registeredCallback = null;

logger.info("RFID accessor initialization");

module.exports = exports = function(givenCallback){
	registeredCallback = givenCallback;
};

var mainProcessShutdown = false;

var initChildProcess = function()
{
	var child = spawn("node", [__dirname + "/" + "rc522_output.js"]);
	var linereader = readline.createInterface(child.stdout, child.stdin);

	linereader.on('line', function (rfidTagSerialNumber) {
		if(registeredCallback instanceof Function)
		{
			registeredCallback(rfidTagSerialNumber);
		}
	});

	child.on('close', function(code) {
		if(!mainProcessShutdown)
		{
			initChildProcess();
		}
	});
};

// And the exit event shuts down the child.
process.once("exit", function () {
	mainProcessShutdown = true;
	child.shutdown();
});

// This is a somewhat ugly approach, but it has the advantage of working
// in conjunction with most of what third parties might choose to do with
// uncaughtException listeners, while preserving whatever the exception is.
process.once("uncaughtException", function (error) {
	// If this was the last of the listeners, then shut down the child and rethrow.
	// Our assumption here is that any other code listening for an uncaught
	// exception is going to do the sensible thing and call process.exit().
	if (process.listeners("uncaughtException").length === 0) {
		mainProcessShutdown = true;
		child.shutdown();
		throw error;
	}
});

initChildProcess();