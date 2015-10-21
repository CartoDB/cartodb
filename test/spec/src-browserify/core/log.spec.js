var Config = require('../../../../src-browserify/core/config');
var setupLog = require('../../../../src-browserify/core/log');

describe('core/log', function() {
  it('should has error, log and debug', function() {
    var cdb = {
      config: new Config(),
      errors: jasmine.createSpy('ErrorList', ['create'])
    };
    var Log = setupLog(cdb);
    var log = new Log({tag: 'test'});
    expect(log.error).toBeTruthy();
    expect(log.debug).toBeTruthy();
    expect(log.log).toBeTruthy();
  });
});
