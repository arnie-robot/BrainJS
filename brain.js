// includes
var Buffer = require('buffer').Buffer;
var dgram = require('dgram');
var log = require('sys').log;
var fs = require('fs');

// startup and load configurations
log('Initialising');

log('Loading configuration');
configstring = fs.readFileSync('config.json', 'ascii');
var config = JSON.parse(configstring);
log('Configuration loaded');

log('Loading instructions');
instructionstring = fs.readFileSync(config.instructions, 'ascii');
var instructions = JSON.parse(instructionstring);
log('Instructions loaded');

// data values
var lastPos = '';
var prevPos = '';

var lastObserve = '';
var prevObserve = '';

// outgoing socket
spine_sock = dgram.createSocket("udp4");

// incoming sockets
sock = dgram.createSocket("udp4", function (msg, rinfo) {
    str = msg.toString('ascii', 0, rinfo.size);
    lastPos = str.split(';')[0].split(',');
});
sock2 = dgram.createSocket("udp4", function (msg, rinfo) {
    str = msg.toString('ascii', 0, rinfo.size);
    items = str.split(';');
    for (var i in items) {
        items[i] = items[i].split(',');
    }
    lastObserve = items;
});

sock.bind(config.connections.incoming.position.port, config.connections.incoming.position.host);
log('Connected to ' + config.connections.incoming.position.host + ':' + config.connections.incoming.position.port + ' for position');

sock2.bind(config.connections.incoming.observation.port, config.connections.incoming.observation.host);
log('Connected to ' + config.connections.incoming.observation.host + ':' + config.connections.incoming.observation.host + ' for observation');

// function to dispatch request
function dispatch(str) {
    buffer = new Buffer(str);
    spine_sock.send(buffer, 0, buffer.length, config.connections.outgoing.spine.port, config.connections.outgoing.spine.host);
}

// returns the new position, or false
function getNewPos() {
    if (prevPos != lastPos) {
        prevPos = lastPos;
        return lastPos;
    }
    return false;
}

// returns the new data observation, or false
function getNewObservation() {
    if (prevObserve != lastObserve) {
        prevObserve = lastObserve;
        return lastObserve;
    }
    return false;
} 

// recurring loop
setInterval(function () {
    latest = getNewPos();
    if (latest) {
        log(latest);
    }
    obs = getNewObservation();
    if (obs) {
        log(obs);
    }
}, 1);