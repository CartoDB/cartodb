var Point = require('../../../../src/geo/geometry-models/point');

describe('src/geo/geometry-models/point', function () {
  beforeEach(function () {
    this.point = new Point({
      latlng: [100, 200]
    });
  });

  describe('.toGeoJSON', function () {
    it('should generate the GeoJSON correctly', function () {
      expect(this.point.toGeoJSON()).toEqual({
        type: 'Point',
        coordinates: [ 200, 100 ]
      });
    });
  });
});
