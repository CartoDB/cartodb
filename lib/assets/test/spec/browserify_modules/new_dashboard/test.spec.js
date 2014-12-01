var myTest = require('new_dashboard/test');

describe('test', function() {
  it ('returns the given str as-is', function() {
    var consoleSpy = jasmine.createSpyObj('console', ['info']);
    myTest('foobar', consoleSpy);

    expect(consoleSpy.info).toHaveBeenCalledWith('foobar');
  });
});
