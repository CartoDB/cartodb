var Polyline = require('../../../../src/geo/geometry-models/polyline');

describe('src/geo/geometry-models/polyline', function () {
  beforeEach(function () {
    this.polyline = new Polyline(null, {
      latlngs: [
        [-1, 1], [1, 2], [3, 4]
      ]
    });
  });

  describe('.toGeoJSON', function () {
    it('should generate the GeoJSON correctly', function () {
      expect(this.polyline.toGeoJSON()).toEqual({
        type: 'LineString',
        coordinates: [
          [ 1, -1 ], [ 2, 1 ], [ 4, 3 ]
        ]
      });
    });
  });

  describe('.setCoordinatesFromGeoJSON', function () {
    it('should update the coordinates', function () {
      var newAndExpectedGeoJSON = {
        type: 'LineString',
        coordinates: [
          [ 0, 0 ], [ 1, 1 ], [ 2, 2 ]
        ]
      };
      this.polyline.setCoordinatesFromGeoJSON(newAndExpectedGeoJSON);
      expect(this.polyline.toGeoJSON()).toEqual(newAndExpectedGeoJSON);
    });
  });
});
