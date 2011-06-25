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

// how many times the same action has been executed in succession
var subsequentActionExecutions = 0;

// how many times the same trajectory component has been executed in succession
var subsequentTrajectoryExecutions = 0;

// the last data that was dispatched
var lastDispatched = [0,0,0];

// a set of variables that can be saved and written to for command processing
var variables = {};

/**
* Methods
*/

// initialisation
this.init = function () {
    this.trajectories = []
    this.variables = {}
    this.subsequentActionExecutions = 0;
    this.subsequentTrajectoryExecutions = 0;
    this.lastDispatched = [0,0,0];
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
    result = ["0", "0", "0"];
    coordinates = ['x', 'y', 'z'];

    log(obj.trajectories);

    // loop over each trajectory we have to use
    for (var trajectory = 0; trajectory < obj.trajectories.length; trajectory++) {

        // compute what step of the trajectory we are at
        var step = tick - obj.trajectories[trajectory][1];

        // do we need trajectory step verification
        verification = obj.instructions.actions[obj.trajectories[trajectory][0]].trajectoryVerification;
        log("Assessing verification requirement");
        if (verification && step > 0) { // we require verification and aren't executing the first step
            // do verification of previous step
            log("We are performing verification");
            armstate = obj.getLastPos();
            expected = obj.instructions.actions[obj.trajectories[trajectory][0]].trajectory[step-1]
            verified = true;
            var threshold = 25;
            for (var c in coordinates) {
                var ec;
                if (typeof(expected[coordinates[c]]) == "string") {
                    ec = obj.variables[expected[coordinates[c]]][c]
                } else {
                    ec = expected[coordinates[c]];
                }
                if (armstate[c] < (ec - threshold)) {
                    verified = false;
		    log("Armstate " + c + " was outside threshold " + ec + " - " + threshold);
                    break;
                }
                if (armstate[c] > (ec + threshold)) {
		    log("Armstate " + c + " was outside threshold " + ec + " + " + threshold);
                    verified = false;
                    break;
                }
            }
            if (!verified) {
                // verification failed
                log("Verification FAILED");

                // see if we're over the maximum permitted trajectory attempts
                if (obj.instructions.actions[obj.trajectories[trajectory][0]].reset.timeout > 0 &&
                    obj.instructions.actions[obj.trajectories[trajectory][0]].reset.timeout <= obj.subsequentTrajectoryExecutions) {
                    // we have been told to execute only a certain number of times, and we have exceeded this
                    log("Subsequent executions for trajectory component exceeded, executing fallback action");

                    // remove the trajectory we no longer want to do from the list of executing trajectories
                    obj.trajectories.splice(trajectory, 1);
                    trajectory -= 1;
                    // set up the reset action
                    action = obj.instructions.actions[obj.trajectories[trajectory][0]].reset.action;
                    delay = obj.instructions.actions[obj.trajectories[trajectory][0]].reset.delay;
                    obj.addTrajectory(action, delay);
                    continue;
                }

                obj.subsequentTrajectoryExecutions++;
                obj.trajectories[trajectory][1] += 2; // nudge this trajectory back two steps (move start time forward 2)
                continue; // attempt next time around
            } else {
                log("Verification SUCCEEDED");
                obj.subsequentTrajectoryExecutions = 0; // we didn't repeat or anything so set this to zero
            }
        }

        // see if we want to take the decision now for the previous step
        decisions = obj.instructions.actions[obj.trajectories[trajectory][0]].decisions;
        for (var d in decisions) {
            if (step-1 == decisions[d].executeAfter) {
                // we are taking the decision
                log('Executing decision');

                try {
                    // verify arm state
                    armstate = obj.getLastPos();
                    expectedarm = decisions[d].state.arm;

                    // check if any of the arm positions are variable-based
                    for (c in coordinates) {
                        if (expectedarm[coordinates[c]] != -1 && typeof(expectedarm[coordinates[c]][0]) == "string") {
                            if (expectedarm[coordinates[c]][0] in obj.variables) {
                                expectedarm[coordinates[c]][0] = obj.variables[expectedarm[coordinates[c]][0]][c];
                            } else {
                                throw "The arm's " + coordinates[c] + " variable is not present";
                            }
                        }
                    }

                    // check the arm position
                    for (c in coordinates) {
                        if (expectedarm[coordinates[c]] != -1 && armstate[c] < (expectedarm[coordinates[c]][0] - expectedarm[coordinates[c]][1])) {
                            throw "Arm " + coordinates[c] + " too low, was " + armstate[c] + " less than " + expectedarm[coordinates[c]][0] + " - " + expectedarm[coordinates[c]][1];
                        }
                        if (expectedarm[coordinates[c]] != -1 && armstate[c] > (expectedarm[coordinates[c]][0] + expectedarm[coordinates[c]][1])) {
                            throw "Arm " + coordinates[c] + " too high, was " + armstate[c] + " greater than " + expectedarm[coordinates[c]][0] + " + " + expectedarm[coordinates[c]][1];
                        }
                    }

                    // we matched the arm state, so save what it was off to the variables
                    obj.variables[obj.trajectories[trajectory][0] + "," + d + ",arm"] = armstate;

                    // verify object state
                    objects = obj.getLastObservation();
                    expectedobjects = decisions[d].state.objects;
                    for (var object in expectedobjects) {
                        var o = expectedobjects[object];

                        // check if any of the object positions are variable-based
                        for (c in coordinates) {
                            if (o[coordinates[c]] != -1 && typeof(o[coordinates[c]][0]) == "string") {
                                if (o[coordinates[c]][0] in obj.variables) {
                                    o[coordinates[c]][0] = obj.variables[o[coordinates[c]][0]][c];
                                    log("Assigned object " + object + "'s " + coordinates[c] + " variable to " + o[coordinates[c]][0] + " based on variable input");
                                } else {
                                    throw "Object " + object + "'s " + coordinates[c] + " variable is not present";
                                }
                            }
                        }

                        var matched = false;
                        var a = [-1,-1,-1];
                        for (var actual in objects) {
                            a = objects[actual];
                            matched = true;

                            for (c in coordinates) {
                                if (o[coordinates[c]] != -1 && a[c] < (o[coordinates[c]][0] - o[coordinates[c]][1])) {
                                    matched = false;
                                }
                                if (o[coordinates[c]] != -1 && a[c] > (o[coordinates[c]][0] + o[coordinates[c]][1])) {
                                    matched = false;
                                }
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
                        } else {
                            // matched, so save this matched state to the variables
                            obj.variables[obj.trajectories[trajectory][0] + "," + d + "," + actual] = a;
                        }
                    }

                    // we passed the tests
                    log("Decision conditions passed");
                    action = decisions[d].success.action;
                    delay = decisions[d].success.delay;
                } catch (e) {
                    // we failed a test
                    log("Decision condition failed - " + e);
                    action = decisions[d].fail.action;
                    delay = decisions[d].fail.delay;
                }
                if (action == obj.trajectories[trajectory][0]) {
                    obj.subsequentActionExecutions++;
                    log("Action repeated")
                } else {
                    obj.subsequentActionExecutions = 0;
                }
                if (obj.instructions.actions[obj.trajectories[trajectory][0]].reset.timeout > 0 &&
                    obj.instructions.actions[obj.trajectories[trajectory][0]].reset.timeout < obj.subsequentActionExecutions) {
                    // we have been told to execute only a certain number of times, and we have exceeded this
                    log("Subsequent executions for action exceeded, executing fallback action");
                    action = obj.instructions.actions[obj.trajectories[trajectory][0]].reset.action;
                    delay = obj.instructions.actions[obj.trajectories[trajectory][0]].reset.delay;
                }

                // actually execute the trajectory
                obj.addTrajectory(action, delay);
            }
        }

        // see where we are in the trajectory
        if (step >= obj.instructions.actions[obj.trajectories[trajectory][0]].trajectory.length) {
            // we have finished the trajectory - so remove it
            obj.trajectories.splice(trajectory, 1);
            trajectory -= 1;
            continue;
        } else if (step >= 0) {
            // loop over x, y, z coordinates
            for (c in coordinates) {
                // we have not finished the trajectory and we have a valid start point
                var coord_val = obj.instructions.actions[obj.trajectories[trajectory][0]].trajectory[step][coordinates[c]];
                if (typeof(coord_val) == "string") {
                    // variable so need to look up the value
                    coord_val = obj.variables[coord_val][c]
                }
                if (result[c] == "0") {
                    result[c] = coord_val;
                } else {
                    result[c] += coord_val;
                }
            }
        }

    }
    console.log(result);
    console.log(obj.trajectories);
    console.log(obj.variables);

    for (var i in result) {
        if (result == "0") {
            result[i] = obj.lastDispatched[i];
        }
    }
    obj.lastDispatched = result;
    obj.dispatch(result.join(','));

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
