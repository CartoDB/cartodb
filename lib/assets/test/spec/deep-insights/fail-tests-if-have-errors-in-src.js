// Catch any eventual errors that happens when test suite is setup, and re-throw once the test runner is ready
var _ = require('underscore');
var orgOnError = window.onerror;
var onErrorArguments = [];

window.onerror = function () {
  onErrorArguments.push(arguments);
  if (_.isFunction(orgOnError)) {
    return orgOnError.apply(window, arguments);
  }
};

describe('errors thrown when loading src files', function () {
  it('should never ever happen', function () {
    onErrorArguments.forEach(function (args) {
      // args = {0: errorMsg, 1: srcFilepath, 2: column, 3: row, 4: error}
      throw args[4]; // actual err
    });
    expect(onErrorArguments).toEqual([]);
  });
});
