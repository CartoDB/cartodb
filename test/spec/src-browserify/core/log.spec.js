var config = require('cdb.config');
var errors = require('cdb.errors');
var Log = require('cdb/core/log');

describe('core/log', function() {
  beforeEach(function() {
    spyOn(errors, 'create');
  });

  it('should has error, log and debug', function() {
    var log = new Log({tag: 'test'});
    expect(log.error).toBeTruthy();
    expect(log.debug).toBeTruthy();
    expect(log.log).toBeTruthy();
  });
});
