# BrainJS

BrainJS is the brain behind ARNIE, the anthropomorphic robot (see other projects).

BrainJS provides a predictive brain architecture which estimates the environment state after the execution of a defined trajectory,
executes the trajectory, then compares the environment to its prediction in order to reason about the success of its action. This then
allows it to execute subsequent actions based on the result of the test.

BrainJS is implemented in JavaScript and is designed to run on the Node server.

## Execution

Install [Node.JS](http://nodejs.org)

Simply run `node brain.js`

Configuration is achieved through config.json. To program a set of actions (an action is a trajectory plus one or more decisions), use
the instructions.json file.

## License

Copyright 2011 Chris Alexander. Licensed under the MIT License. See the LICENSE file for more information.