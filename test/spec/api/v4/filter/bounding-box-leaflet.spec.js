var carto = require('../../../../../src/api/v4/index');

describe('api/v4/filter/bounding-box-leaflet', function () {
  describe('constructor', function () {
    it('should throw a descriptive error when initialized with invalid parameters', function () {
      expect(function () {
        new carto.filter.BoundingBoxLeaflet(undefined); // eslint-disable-line
      }).toThrowError('Bounding box requires a Leaflet map but got: undefined');
    });
  });
});
