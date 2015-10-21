var $ = require('jquery');
var Config = require('../../../../../src-browserify/core/config');
var setupError = require('../../../../../src-browserify/core/log/error');

describe('core/log/error', function() {
  var Error;

  beforeEach(function() {
    Error = setupError($, new Config());
  });

  it('should set a browser info when created', function() {
    var err = new Error({});
    expect(err.get('browser')).toEqual(JSON.stringify($.browser));
  });

  it('should generate url on-demand', function() {
    // Assumes cdb.config being present, which it is when used in a bundle (through createCdb)
    var err = new Error({});
    expect(err.url()).toEqual('/api/v0/error');
  });
});
