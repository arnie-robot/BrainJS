/**
* Brain.JS
*
* by Chris Alexander
*
* This file is the "thought process", that deals with executing the instruction set
*/

// built-in includes
var log = require('sys').log;

/**
* Variables
*/

// the instructions we are to process
var instructions = {}

/**
* Methods
*/

// initialisation
this.init = function () {
    
}

// dispatches a command to the spine system
this.dispatch = function (str) {
    log('Notice: Dispatch function in thought process has not been provided, no data was dispatched');
}

// returns a new position or false if there is none
this.getNewPos = function () {
    log('Notice: getNewPos function in thought process has not been provided');
}

// returns the last known position
this.getLastPos = function () {
    log('Notice: getLastPos function in thought process has not been provided');
}

// returns a new observation or false if there is none
this.getNewObservation = function () {
    log('Notice: getNewObservation function in thought process has not been provided');
}

// returns the last known observation
this.getLastObservation = function () {
    log('Notice: getLastObservation function in thought process has not been provided');
}