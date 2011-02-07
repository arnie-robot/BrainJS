// includes
var Buffer = require('buffer').Buffer;
var dgram = require('dgram');
var log = require('sys').log;

log('Initialising');

// data values
var incoming_host = '192.168.1.2';
var incoming_pos_port = 26000;
var incoming_data_port = 26001;

var spine_host = '192.168.1.1';
var spine_port = 26000;

var lastPos = '';
var prevPos = '';

var lastObserve = '';
var prevObserve = '';

// outgoing socket
spine_sock = dgram.createSocket("udp4");

// incoming socket
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

sock.bind(incoming_pos_port, incoming_host);
log('Connected to ' + incoming_host + ':' + incoming_pos_port + ' for position');

sock2.bind(incoming_data_port, incoming_host);
log('Connected to ' + incoming_host + ':' + incoming_data_port + ' for observation');

// function to dispatch request
function dispatch(str) {
    buffer = new Buffer(str);
    spine_sock.send(buffer, 0, buffer.length, spine_port, spine_host);
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