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
    beforeEach(function () {
      this.changeCallback = jasmine.createSpy('changeCallback');
      this.polyline.on('change', this.changeCallback);
    });

    describe('when given a GeoJSON with the same coordinates', function () {
      beforeEach(function () {
        var newAndExpectedGeoJSON = this.polyline.toGeoJSON();
        this.polyline.setCoordinatesFromGeoJSON(newAndExpectedGeoJSON);
      });

      it('should NOT trigger a "change" event', function () {
        expect(this.changeCallback).not.toHaveBeenCalled();
      });
    });

    describe('when given a GeoJSON with different coordinates', function () {
      beforeEach(function () {
        var newAndExpectedGeoJSON = {
          type: 'LineString',
          coordinates: [
            [ 0, 0 ], [ 1, 1 ], [ 2, 2 ]
          ]
        };
        this.polyline.setCoordinatesFromGeoJSON(newAndExpectedGeoJSON);
        expect(this.polyline.toGeoJSON()).toEqual(newAndExpectedGeoJSON);
      });

      it('should trigger a "change" event', function () {
        expect(this.changeCallback).toHaveBeenCalled();
      });

      it('should update the coordinates', function () {
        expect(this.polyline.toGeoJSON()).toEqual({
          type: 'LineString',
          coordinates: [ [ 0, 0 ], [ 1, 1 ], [ 2, 2 ] ]
        });
      });
    });
  });
});
