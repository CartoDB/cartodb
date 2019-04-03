var carto = require('../../../../../src/api/v4/index');

describe('api/v4/filter/bounding-box-gmaps', function () {
  describe('constructor', function () {
    it('should throw a descriptive error when initialized with invalid parameters', function () {
      expect(function () {
        new carto.filter.BoundingBoxGoogleMaps(undefined); // eslint-disable-line
      }).toThrowError('Bounding box requires a Google Maps map but got: undefined');
    });
  });
});
