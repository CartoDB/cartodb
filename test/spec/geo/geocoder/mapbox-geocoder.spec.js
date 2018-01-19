var mapboxGeocoder = require('../../../../src/geo/geocoder/mapbox-geocoder');
var mockResponse = require('./mapbox-geocoder-response');

fdescribe('mapbox-geocoder', function () {
  describe('.geocode', function () {
    beforeEach(function () {
      spyOn(window, 'fetch').and.returnValue(Promise.resolve({ json: function () { return mockResponse; } }));
    });

    it('should geocode a city location', function (done) {
      mapboxGeocoder.geocode('Vigo')
        .then(function (results) {
          expect(results).toBeDefined();
          done();
        });
    });

    it('should return a well formated response', function (done) {
      mapboxGeocoder.geocode('Vigo')
        .then(function (result) {
          result = result[0];
          expect(result.center).toBeDefined();
          expect(result.center.lat).toEqual(34.0544);
          expect(result.center.lon).toEqual(-118.2439);
          // Bbox
          expect(result.bbox.south).toEqual(-118.529221009603);
          expect(result.bbox.west).toEqual(33.901599990108);
          expect(result.bbox.north).toEqual(-118.121099990025);
          expect(result.bbox.east).toEqual(34.1612200099034);
          // Type
          expect(result.type).toEqual('venue');
          done();
        }).catch(console.warn);
    });

    it('should return an empty array when the response is empty', function (done) {
      pending('SIMULATE AN EMPTY RESPONSE');
      window.fetch.and.returnValue(Promise.resolve({ json: function () { return []; } }));
      mapboxGeocoder.geocode('Vigo')
        .then(function (result) {
          expect(result).toEqual([]);
        });
    });
  });
});
