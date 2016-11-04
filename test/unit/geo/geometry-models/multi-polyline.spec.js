var MultiPolyline = require('../../../../src/geo/geometry-models/multi-polyline');

describe('src/geo/geometry-models/multi-polyline', function () {
  beforeEach(function () {
    this.multiPolyline = new MultiPolyline(null, {
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
      expect(this.multiPolyline.toGeoJSON()).toEqual({
        type: 'MultiLineString',
        coordinates: [
          [
            [ 1, 0 ], [ 2, 1 ], [ 3, 2 ], [ 4, 3 ]
          ], [
            [ 10, 0 ], [ 20, 10 ], [ 30, 20 ], [ 40, 30 ]
          ]
        ]
      });
    });
  });

  describe('.setCoordinatesFromGeoJSON', function () {
    it('should update the coordinates', function () {
      var newAndExpectedGeoJSON = {
        type: 'MultiLineString',
        coordinates: [
          [
            [ 100, 0 ], [ 2, 1 ], [ 3, 2 ], [ 40, 30 ]
          ], [
            [ 100, 0 ], [ 20, 10 ], [ 30, 20 ], [ 40, 30 ]
          ]
        ]
      };
      this.multiPolyline.setCoordinatesFromGeoJSON(newAndExpectedGeoJSON);
      expect(this.multiPolyline.toGeoJSON()).toEqual(newAndExpectedGeoJSON);
    });
  });
});
