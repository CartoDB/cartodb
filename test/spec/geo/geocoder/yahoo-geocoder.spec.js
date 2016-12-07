var YAHOO = require('../../../../src/geo/geocoder/yahoo-geocoder');

describe('geo/geocoder/yahoo-geocoder', function () {
  var originalTimeout;
  beforeEach(function () {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });

  afterEach(function () {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  it("we shouldn't get a direction that doesn't exist", function (done) {
    YAHOO.geocode('68461092610314965639', function (d) {
      expect(d.length).toEqual(0);
      done();
    });
  });
});
