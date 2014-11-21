var hello = require('dashboard/hello_world');

describe('hello', function() {
  beforeEach(function() {
    window.console = jasmine.createSpyObj('console', ['log']);
    hello('hello world!');
  });

  it('writes the given string to the console.log', function() {
    expect(console.log).toHaveBeenCalledWith('hello world!');
  });
});

