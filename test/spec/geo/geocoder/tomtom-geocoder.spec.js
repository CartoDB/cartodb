var tomtomGeocoder = require('../../../../src/geo/geocoder/tomtom-geocoder');
var API_KEY = 'fake_api_key';
describe('tomtom-geocoder', function () {
  describe('.geocode', function () {
    it('should build the right fetch url (add address and apiKey)', function (done) {
      spyOn(window, 'fetch').and.returnValue(Promise.resolve({ json: function () { return { results: [] }; } }));
      tomtomGeocoder.geocode('fake_address', API_KEY).then(function (result) {
        var expectedFetchUrl = 'https://api.tomtom.com/search/2/search/fake_address.json?key=fake_api_key';
        expect(window.fetch).toHaveBeenCalledWith(expectedFetchUrl);
        done();
      });
    });

    it('should geocode a city location', function (done) {
      spyOn(window, 'fetch').and.returnValue(Promise.resolve({ json: function () { return require('./tomtom-geocoder-response-0'); } }));
      tomtomGeocoder.geocode('Santander', API_KEY)
        .then(function (results) {
          expect(results).toBeDefined();
          done();
        });
    });

    it('should return a well formated response [example 0]', function (done) {
      spyOn(window, 'fetch').and.returnValue(Promise.resolve({ json: function () { return require('./tomtom-geocoder-response-0'); } }));
      tomtomGeocoder.geocode('Santander', API_KEY)
        .then(function (results) {
          let bestCandidate = results[0];
          expect(bestCandidate.center).toBeDefined();
          expect(bestCandidate.center[0]).toEqual(43.46141); // lat
          expect(bestCandidate.center[1]).toEqual(-3.8093); // lon
          // Bbox
          expect(bestCandidate.boundingbox.south).toEqual(43.43446);
          expect(bestCandidate.boundingbox.west).toEqual(-3.88905);
          expect(bestCandidate.boundingbox.north).toEqual(43.49482);
          expect(bestCandidate.boundingbox.east).toEqual(-3.76325);
          // Type
          expect(bestCandidate.type).toEqual('localadmin');
          done();
        }).catch(console.error);
    });

    it('should return an empty array when the response is empty', function (done) {
      spyOn(window, 'fetch').and.returnValue(Promise.resolve({ json: function () { return { results: [] }; } }));
      tomtomGeocoder.geocode('ABCDEFGHIJ', API_KEY)
        .then(function (result) {
          expect(result).toEqual([]);
          done();
        });
    });
  });
});
