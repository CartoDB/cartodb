var YAHOO = require('../../../../src/geo/geocoder/yahoo-geocoder');

describe('geo/geocoder/yahoo-geocoder', function () {
  xit("we shouldn't get a direction that doesn't exist", function (done) {
    YAHOO.geocode('68461092610314965639', function (d) {
      expect(d.length).toEqual(0);
      done();
    });
  });
});
