// includes
var Buffer = require('buffer').Buffer;
var dgram = require('dgram');
var log = require('sys').log;

log('Initialising');

// data values
var incoming_host = '192.168.1.2';
var incoming_port = 26000;

var spine_host = '192.168.1.1';
var spine_port = 26000;

var lastData = '';
var prevData = '';

// outgoing socket
spine_sock = dgram.createSocket("udp4");

// incoming socket
sock = dgram.createSocket("udp4", function (msg, rinfo) {
    lastData = msg.toString('ascii', 0, rinfo.size);
});

sock.bind(incoming_port, incoming_host);
log('Connected to ' + incoming_host + ':' + incoming_port);

// function to dispatch request
function dispatch(str) {
    buffer = new Buffer(str);
    spine_sock.send(buffer, 0, buffer.length, spine_port, spine_host);
}

// returns the new data, or false
function getNewData() {
    if (prevData != lastData) {
        prevData = lastData;
        return lastData.split(',');
    }
    return false;
}

// recurring loop
setInterval(function () {
    latest = getNewData();
    if (latest) {
        log(latest);
        dispatch(latest[0] + ',' + latest[1] + ',' + latest[2]);
    }
}, 1);