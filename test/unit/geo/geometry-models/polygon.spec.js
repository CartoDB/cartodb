var Polygon = require('../../../../src/geo/geometry-models/polygon');

describe('src/geo/geometry-models/polygon', function () {
  beforeEach(function () {
    this.polygon = new Polygon(null, {
      latlngs: [
        [-1, 1], [1, 2], [3, 4]
      ]
    });
  });

  describe('.toGeoJSON', function () {
    it('should generate the GeoJSON correctly', function () {
      expect(this.polygon.toGeoJSON()).toEqual({
        type: 'Polygon',
        coordinates: [
          [ [ 1, -1 ], [ 2, 1 ], [ 4, 3 ], [ 1, -1 ] ]
        ]
      });
    });
  });

  describe('.setCoordinatesFromGeoJSON', function () {
    it('should update the coordinates', function () {
      var newAndExpectedGeoJSON = {
        type: 'Polygon',
        coordinates: [
          [ [ 0, 0 ], [ 10, 10 ], [ 20, 20 ], [ 0, 0 ] ]
        ]
      };
      this.polygon.setCoordinatesFromGeoJSON(newAndExpectedGeoJSON);
      expect(this.polygon.toGeoJSON()).toEqual(newAndExpectedGeoJSON);
    });
  });
});
