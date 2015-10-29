var cdb = require('cdb-proxy').set({}).get();
var Config = require('../../../../src-browserify/core/config');
var Log = require('../../../../src-browserify/core/log');

describe('core/log', function() {
  it('should has error, log and debug', function() {
    cdb.config = new Config();
    cdb.errors = jasmine.createSpy('ErrorList', ['create']);
    var log = new Log({tag: 'test'});
    expect(log.error).toBeTruthy();
    expect(log.debug).toBeTruthy();
    expect(log.log).toBeTruthy();
  });
});
