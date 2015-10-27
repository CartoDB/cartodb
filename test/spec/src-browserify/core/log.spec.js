var cdb = require('cdb-proxy').set({}).get();
var config = require('../../../../src-browserify/cdb.config');
var configProxy = require('config-proxy');

var Log = require('../../../../src-browserify/core/log');

describe('core/log', function() {
  it('should has error, log and debug', function() {
    configProxy.set(config);
    cdb.errors = jasmine.createSpy('ErrorList', ['create']);
    var log = new Log({tag: 'test'});
    expect(log.error).toBeTruthy();
    expect(log.debug).toBeTruthy();
    expect(log.log).toBeTruthy();
  });
});
