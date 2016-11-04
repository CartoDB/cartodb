var MultiPolygon = require('../../../../src/geo/geometry-models/multi-polygon');

describe('src/geo/geometry-models/multi-polygon', function () {
  beforeEach(function () {
    this.multiPolygon = new MultiPolygon(null, {
      latlngs: [
        [
          [0, 1],
          [1, 2],
          [2, 3],
          [3, 4]
        ],
        [
          [0, 10],
          [10, 20],
          [20, 30],
          [30, 40]
        ]
      ]
    });
  });

  describe('.toGeoJSON', function () {
    it('should generate the GeoJSON correctly', function () {
      expect(this.multiPolygon.toGeoJSON()).toEqual({
        type: 'MultiPolygon',
        coordinates: [
          [
            [ [ 1, 0 ], [ 2, 1 ], [ 3, 2 ], [ 4, 3 ], [ 1, 0 ] ]
          ], [
            [ [ 10, 0 ], [ 20, 10 ], [ 30, 20 ], [ 40, 30 ], [ 10, 0 ] ]
          ]
        ]
      });
    });
  });

  describe('.setCoordinatesFromGeoJSON', function () {
    it('should update the coordinates', function () {
      var newAndExpectedGeoJSON = {
        type: 'MultiPolygon',
        coordinates: [
          [
            [ [ 0, 0 ], [ 2, 1 ], [ 3, 2 ], [ 4, 3 ], [ 0, 0 ] ]
          ], [
            [ [ 100, 0 ], [ 20, 10 ], [ 30, 20 ], [ 40, 30 ], [ 100, 0 ] ]
          ]
        ]
      };
      this.multiPolygon.setCoordinatesFromGeoJSON(newAndExpectedGeoJSON);
      expect(this.multiPolygon.toGeoJSON()).toEqual(newAndExpectedGeoJSON);
    });
  });
});
