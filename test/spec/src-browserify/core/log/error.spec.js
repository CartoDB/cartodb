var $ = require('jquery');
var ErrorModel = require('cdb/core/log/error');

describe('core/log/error', function() {
  it('should set a browser info when created', function() {
    var err = new ErrorModel({});
    expect(err.get('browser')).toEqual(JSON.stringify($.browser));
  });

  it('should generate url on-demand', function() {
    // Assumes cdb.config being present, which it is when used in a bundle (through createCdb)
    var err = new ErrorModel({});
    expect(err.url()).toEqual('/api/v0/error');
  });
});
