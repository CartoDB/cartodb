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

  describe('.setCoordinatesFromGeoJSON', function () {
    it('should update the coordinates', function () {
      var newAndExpectedGeoJSON = {
        type: 'Point',
        coordinates: [ 0, 300 ]
      };
      this.point.setCoordinatesFromGeoJSON(newAndExpectedGeoJSON);
      expect(this.point.toGeoJSON()).toEqual(newAndExpectedGeoJSON);
    });
  });
});
