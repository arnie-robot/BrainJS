/**
* Brain.JS
*
* by Chris Alexander
*
* This file is the main brain system, that handles IO and setting everything up
*/

/**
* Includes
*/

// built-in includes
var Buffer = require('buffer').Buffer;
var dgram = require('dgram');
var log = require('sys').log;
var fs = require('fs');

// library includes
var opts = require('./opts');

// custom includes
var thought = require('./thought');

/**
* Startup and initialisation
*/

log('Initialising');

var config_file = 'config.json';

// Parse the options
var options = [
    { short       : 'c'
    , long        : 'config'
    , description : 'The configuration file'
    , value       : true
    , callback    : function (value) { config_file = value; } // override host value
    }];
opts.parse(options, true);

// load the configuration
log('Loading configuration in "' + config_file + '"');
configstring = fs.readFileSync(config_file, 'ascii');
var config = JSON.parse(configstring);
log('Configuration loaded');

// load the instructions
log('Loading instructions in "' + config.instructions + '"');
instructionstring = fs.readFileSync(config.instructions, 'ascii');
thought.instructions = JSON.parse(instructionstring);
log('Instructions loaded');

/**
* Initialise values
*/

var lastPos = '';
var prevPos = '';

var lastObserve = '';
var prevObserve = '';

/**
* Initialise connections
*/

// outgoing socket
spine_sock = dgram.createSocket("udp4");

// incoming sockets
sock = dgram.createSocket("udp4", function (msg, rinfo) {
    str = msg.toString('ascii', 0, rinfo.size);
    split = str.split(';')[0].split(',');
    for (i in split) {
        split[i] = parseFloat(split[i])
    }
    lastPos = split;
});
sock2 = dgram.createSocket("udp4", function (msg, rinfo) {
    str = msg.toString('ascii', 0, rinfo.size);
    log(str);
    items = str.split(';');
    log(items);
    for (var i in items) {
        items[i] = items[i].split(',');
        for (var j in items[i]) {
            items[i][j] = parseFloat(items[i][j]);
        }
    }
    log(items);
    lastObserve = items;
});

sock.bind(config.connections.incoming.position.port, config.connections.incoming.position.host);
log('Connected to ' + config.connections.incoming.position.host + ':' + config.connections.incoming.position.port + ' for position');

sock2.bind(config.connections.incoming.observation.port, config.connections.incoming.observation.host);
log('Connected to ' + config.connections.incoming.observation.host + ':' + config.connections.incoming.observation.port + ' for observation');

/**
* Functions for getting and sending data
*/

// function to dispatch request
function dispatch(str) {
    buffer = new Buffer(str);
    log('Dispatching ' + str);
    spine_sock.send(buffer, 0, buffer.length, config.connections.outgoing.spine.port, config.connections.outgoing.spine.host);
}
// attach it to the thought process
thought.dispatch = dispatch;

// returns the new position, or false
function getNewPos() {
    if (prevPos != lastPos) {
        prevPos = lastPos;
        return lastPos;
    }
    return false;
}
// attach it to the thought process
thought.getNewPos = getNewPos;

// returns the last known position
function getLastPos() {
    return lastPos;
}
// attach it to the thought process
thought.getLastPos = getLastPos;

// returns the new data observation, or false
function getNewObservation() {
    if (prevObserve != lastObserve) {
        prevObserve = lastObserve;
        return lastObserve;
    }
    return false;
}
// attach it to the thought process
thought.getNewObservation = getNewObservation;

// return the last known data observation
function getLastObservation() {
    return lastObserve;
}
// attach it to the thought process
thought.getLastObservation = getLastObservation;

/**
* Run the program
*/

// initialise the thought process
thought.init();

// tell it to think
thought.think(10000);
