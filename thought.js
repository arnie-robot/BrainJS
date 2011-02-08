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

// which thought tick we are currently on
var tick = 0;

// the loop which we will reference the interval with
var loop = 0;

// an array of trajectories that are currently being executed
var trajectories = []

/**
* Methods
*/

// initialisation
this.init = function () {
    this.trajectories = []
    this.addTrajectory(this.instructions.initialAction);
}

// starts thinking
this.think = function (t) {
    if (!t) {
        t = 2500;
    }
    loop = setInterval(this.next, t, this);
}

// stops program execution
this.stop = function () {
    clearInterval(loop);
}

// executes the next thought tick
this.next = function (obj) {
    // compute which trajectories are telling us to do what
    result = { "x": -1, "y": -1, "z": -1 }
    coordinates = ['x', 'y', 'z'];

    // loop over each trajectory we have to use
    for (var trajectory in obj.trajectories) {
        // compute what step of the trajectory we are at
        var step = tick - obj.trajectories[trajectory][1];
        if (step >= obj.instructions.actions[obj.trajectories[trajectory][0]].trajectory.length) {
            // we have finished the trajectory - so remove it
            obj.trajectories.splice(trajectory, 1);
        } else if (step >= 0) {
            // loop over x, y, z coordinates
            for (var coord in coordinates) {
                // we have not finished the trajectory and we have a valid start point
                var coord_val = obj.instructions.actions[obj.trajectories[trajectory][0]].trajectory[step][coordinates[coord]];
                if (coord_val >= 0) {
                    if (result[coordinates[coord]] < 0) {
                        result[coordinates[coord]] = coord_val;
                    } else {
                        result[coordinates[coord]] += coord_val;
                    }
                }
            }
        }
    }
    console.log(result);
    console.log(obj.trajectories);
    // increment the tick for next run
    log('Tick ' + tick + ' complete');
    tick++;
}

// adds a trajectory to the execution stack
this.addTrajectory = function (name, wait) {
    if (!wait) {
        wait = 1;
    }
    this.trajectories.push([name, tick + wait]);
}

/**
* Callback hooks
*/

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