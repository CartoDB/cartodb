var MultiPoint = require('../../../../src/geo/geometry-models/multi-point');

describe('src/geo/geometry-models/multi-point', function () {
  beforeEach(function () {
    this.multiPoint = new MultiPoint(null, {
      latlngs: [
        [0, 1],
        [1, 2]
      ]
    });
  });

  describe('.toGeoJSON', function () {
    it('should generate the GeoJSON correctly', function () {
      expect(this.multiPoint.toGeoJSON()).toEqual({
        type: 'MultiPoint',
        coordinates: [ [ 1, 0 ], [ 2, 1 ] ]
      });
    });
  });

  describe('.setCoordinatesFromGeoJSON', function () {
    it('should update the coordinates', function () {
      var newAndExpectedGeoJSON = {
        type: 'MultiPoint',
        coordinates: [ [ 0, 0 ], [ 10, 10 ] ]
      };
      this.multiPoint.setCoordinatesFromGeoJSON(newAndExpectedGeoJSON);
      expect(this.multiPoint.toGeoJSON()).toEqual(newAndExpectedGeoJSON);
    });
  });
});
