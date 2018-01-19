var mapboxGeocoder = require('../../../../src/geo/geocoder/mapbox-geocoder');

fdescribe('mapbox-geocoder', function () {
  describe('.geocode', function () {
    it('should geocode a city location', function (done) {
      spyOn(window, 'fetch').and.returnValue(Promise.resolve({ json: function () { return require('./mapbox-geocoder-response-0'); } }));
      mapboxGeocoder.geocode('Vigo')
        .then(function (results) {
          expect(results).toBeDefined();
          done();
        });
    });

    it('should return a well formated response [example 0]', function (done) {
      spyOn(window, 'fetch').and.returnValue(Promise.resolve({ json: function () { return require('./mapbox-geocoder-response-0'); } }));
      mapboxGeocoder.geocode('Vigo')
        .then(function (result) {
          result = result[0];
          expect(result.center).toBeDefined();
          expect(result.center.lon).toEqual(-118.2439);
          expect(result.center.lat).toEqual(34.0544);
          // Bbox
          expect(result.bbox.south).toEqual(-118.529221009603);
          expect(result.bbox.west).toEqual(33.901599990108);
          expect(result.bbox.north).toEqual(-118.121099990025);
          expect(result.bbox.east).toEqual(34.1612200099034);
          // Type
          expect(result.type).toEqual('venue');
          done();
        }).catch(console.error);
    });

    it('should return a well formated response when the response has no bbox [example 1]', function (done) {
      spyOn(window, 'fetch').and.returnValue(Promise.resolve({ json: function () { return require('./mapbox-geocoder-response-1'); } }));
      mapboxGeocoder.geocode('Plaza de Barcelos')
        .then(function (result) {
          result = result[0];
          expect(result.center).toBeDefined();
          expect(result.center.lon).toEqual(9.754478);
          expect(result.center.lat).toEqual(47.920347);
          // Bbox
          expect(result.bbox).toBeUndefined();
          // Type
          expect(result.type).toEqual('venue');
          done();
        }).catch(console.error);
    });

    it('should return an empty array when the response is empty', function (done) {
      spyOn(window, 'fetch').and.returnValue(Promise.resolve({json: function () { return {features: []}; }}));
      mapboxGeocoder.geocode('Vigo')
        .then(function (result) {
          expect(result).toEqual([]);
          done();
        });
    });
  });
});
