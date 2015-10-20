var $ = require('jquery');
var Error = require('../../../../../src-browserify/core/log/error');

describe('core/log/error', function() {
  it('should set a browser info when created', function() {
    cartodb.$ = $; // set in createCdb;
    var err = new Error({});
    expect(err.get('browser')).toEqual(JSON.stringify($.browser));
  });

  it('should generate url on-demand', function() {
    // Assumes cdb.config being present, which it is when used in a bundle (through createCdb)
    var err = new Error({});
    expect(err.url()).toEqual('/api/v0/error');
  });
});
