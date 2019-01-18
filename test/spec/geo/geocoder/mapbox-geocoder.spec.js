var mapboxGeocoder = require('../../../../src/geo/geocoder/mapbox-geocoder');
var TOKEN = 'fake_token';
describe('mapbox-geocoder', function () {
  describe('.geocode', function () {
    it('should build the right fetch url (add address and access_token)', function (done) {
      spyOn(window, 'fetch').and.returnValue(Promise.resolve({ json: function () { return require('./mapbox-geocoder-response-0'); } }));
      mapboxGeocoder.geocode('fake_address', TOKEN).then(function (result) {
        var expectedFetchUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places-permanent/fake_address.json?access_token=fake_token';
        expect(window.fetch).toHaveBeenCalledWith(expectedFetchUrl);
        done();
      });
    });

    it('should geocode a city location', function (done) {
      spyOn(window, 'fetch').and.returnValue(Promise.resolve({ json: function () { return require('./mapbox-geocoder-response-0'); } }));
      mapboxGeocoder.geocode('Vigo', TOKEN)
        .then(function (results) {
          expect(results).toBeDefined();
          done();
        });
    });

    it('should return a well formated response [example 0]', function (done) {
      spyOn(window, 'fetch').and.returnValue(Promise.resolve({ json: function () { return require('./mapbox-geocoder-response-0'); } }));
      mapboxGeocoder.geocode('Vigo', TOKEN)
        .then(function (result) {
          result = result[0];
          expect(result.center).toBeDefined();
          expect(result.center[0]).toEqual(34.0544);
          expect(result.center[1]).toEqual(-118.2439);
          // Bbox
          expect(result.boundingbox.south).toEqual(-118.529221009603);
          expect(result.boundingbox.west).toEqual(33.901599990108);
          expect(result.boundingbox.north).toEqual(-118.121099990025);
          expect(result.boundingbox.east).toEqual(34.1612200099034);
          // Type
          expect(result.type).toEqual('venue');
          done();
        }).catch(console.error);
    });

    it('should return a well formated response when the response has no bbox [example 1]', function (done) {
      spyOn(window, 'fetch').and.returnValue(Promise.resolve({ json: function () { return require('./mapbox-geocoder-response-1'); } }));
      mapboxGeocoder.geocode('Plaza de Barcelos', TOKEN)
        .then(function (result) {
          result = result[0];
          expect(result.center).toBeDefined();
          expect(result.center[0]).toEqual(47.920347);
          expect(result.center[1]).toEqual(9.754478);
          // Bbox
          expect(result.bbox).toBeUndefined();
          // Type
          expect(result.type).toEqual('venue');
          done();
        }).catch(console.error);
    });

    it('should return an empty array when the response is empty', function (done) {
      spyOn(window, 'fetch').and.returnValue(Promise.resolve({ json: function () { return { features: [] }; } }));
      mapboxGeocoder.geocode('Vigo', TOKEN)
        .then(function (result) {
          expect(result).toEqual([]);
          done();
        });
    });
  });
});
