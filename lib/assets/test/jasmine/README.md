Specs to be run from the CLI (`npm test` or `jasmine`).

All but views and other DOM-dependent code could/should run in this environment.

Tests can be easily debugged by using [node-inspector](https://github.com/node-inspector/node-inspector). It will always stop on the first line of the program, so easiest is to put a `debugger` statement somewhere in the code and then `npm run test-debug` to be able to quickly jump where you want to debug the code.
