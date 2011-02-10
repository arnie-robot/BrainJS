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
    result = [-1, -1, -1];
    coordinates = ['x', 'y', 'z'];

    // loop over each trajectory we have to use
    for (var trajectory = 0; trajectory < obj.trajectories.length; trajectory++) {
        // compute what step of the trajectory we are at
        var step = tick - obj.trajectories[trajectory][1];
        if (step >= obj.instructions.actions[obj.trajectories[trajectory][0]].trajectory.length) {
            // we have finished the trajectory - so remove it
            obj.trajectories.splice(trajectory, 1);
            trajectory -= 1;
            continue;
        } else if (step >= 0) {
            // loop over x, y, z coordinates
            for (var coord in coordinates) {
                // we have not finished the trajectory and we have a valid start point
                var coord_val = obj.instructions.actions[obj.trajectories[trajectory][0]].trajectory[step][coordinates[coord]];
                if (coord_val >= 0) {
                    if (result[coord] < 0) {
                        result[coord] = coord_val;
                    } else {
                        result[coord] += coord_val;
                    }
                }
            }
        }

        // see if we want to take the decision now
        decisions = obj.instructions.actions[obj.trajectories[trajectory][0]].decisions;
        for (var d in decisions) {
            if (step == decisions[d].executeAfter) {
                // we are taking the decision
                log('Executing decision');

                try {
                    // verify arm state
                    armstate = obj.getLastPos();
                    expectedarm = decisions[d].state.arm;
                    if (expectedarm.x != -1 && armstate[0] < (expectedarm.x[0] - expectedarm.x[1])) {
                        throw "Arm X too low";
                    }
                    if (expectedarm.x != -1 && armstate[0] > (expectedarm.x[0] + expectedarm.x[1])) {
                        throw "Arm X too high";
                    }
                    if (expectedarm.y != -1 && armstate[1] < (expectedarm.y[0] - expectedarm.y[1])) {
                        throw "Arm Y too low";
                    }
                    if (expectedarm.y != -1 && armstate[1] > (expectedarm.y[0] + expectedarm.y[1])) {
                        throw "Arm Y too high";
                    }
                    if (expectedarm.z != -1 && armstate[2] < (expectedarm.z[0] - expectedarm.z[1])) {
                        throw "Arm Z too low";
                    }
                    if (expectedarm.z != -1 && armstate[2] > (expectedarm.z[0] + expectedarm.z[1])) {
                        throw "Arm Z too high";
                    }

                    // verify object state
                    objects = obj.getLastObservation();
                    expectedobjects = decisions[d].state.objects;
                    for (var object in expectedobjects) {
                        var o = expectedobjects[object];
                        for (var actual in objects) {
                            var a = objects[actual];
                            var matched = true;
                            console.log(a);
                            console.log(o);
                            if (o.x != -1 && a[0] < (o.x[0] - o.x[1])) {
                                matched = false;
                            }
                            if (o.x != -1 && a[0] > (o.x[0] + o.x[1])) {
                                matched = false;
                            }
                            if (o.y != -1 && a[1] < (o.y[0] - o.y[1])) {
                                matched = false;
                            }
                            if (o.y != -1 && a[1] > (o.y[0] + o.y[1])) {
                                matched = false;
                            }
                            if (o.z != -1 && a[2] < (o.z[0] - o.z[1])) {
                                matched = false;
                            }
                            if (o.z != -1 && a[2] > (o.z[0] + o.z[1])) {
                                matched = false;
                            }

                            // we matched so no need to continue
                            if (matched) {
                                // splice out this result so it can't match another one
                                objects.splice(actual, 1);
                                break;
                            }
                        }
                        // nothing matched so throw out
                        if (!matched) {
                            throw "Failed to find a match for object " + object;
                        }
                    }

                    // we passed the tests
                    log("Decision conditions passed");
                    obj.addTrajectory(decisions[d].success.action, decisions[d].success.delay);
                } catch (e) {
                    // we failed a test
                    log("Decision condition failed - " + e);
                    obj.addTrajectory(decisions[d].fail.action, decisions[d].fail.delay);
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
        wait = 0;
    }
    this.trajectories.push([name, tick + wait + 1]);
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