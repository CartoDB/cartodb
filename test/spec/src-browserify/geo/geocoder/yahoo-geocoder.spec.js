var $ = require('jquery');
var YAHOO = require('cdb/geo/geocoder/yahoo-geocoder');

describe('geo/geocoder/yahoo-geocoder', function() {
  it("we shouldn't get a direction that doesn't exist", function(done) {
    YAHOO.geocode('Wadusworld', function(d) {
      expect(d.length).toEqual(0);
      done();
    });
  });
});
