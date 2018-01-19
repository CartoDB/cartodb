var mapboxGeocoder = require('../../../../src/geo/geocoder/mapbox-geocoder');

fdescribe('mapbox-geocoder', function () {
  it('should geocode a city location', function (done) {
    mapboxGeocoder.geocode('Vigo', function (results) {
      expect(results).toBeDefined();
      done();
    });
  });
});
