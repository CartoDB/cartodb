var $ = require('jquery');
var jQueryProxy = require('jquery-proxy');
var YAHOO = require('../../../../../src-browserify/geo/geocoder/yahoo-geocoder');

describe('geo/geocoder/yahoo-geocoder', function() {
  beforeEach(function() {
    jQueryProxy.set($);
  });

  it("we shouldn't get a direction that doesn't exist", function(done) {
    YAHOO.geocode('Wadusworld', function(d) {
      expect(d.length).toEqual(0);
      done();
    });
  });
});
