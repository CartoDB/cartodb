var Log = require('../../../../src-browserify/core/log');

describe('core/log', function() {
  it('should has error, log and debug', function() {
    var log = new Log({tag: 'test'});
    expect(log.error).toBeTruthy();
    expect(log.debug).toBeTruthy();
    expect(log.log).toBeTruthy();
  });
});
