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
    beforeEach(function () {
      this.changeCallback = jasmine.createSpy('changeCallback');
      this.polygon.on('change', this.changeCallback);
    });

    describe('when given a GeoJSON with the same coordinates', function () {
      beforeEach(function () {
        var newAndExpectedGeoJSON = this.polygon.toGeoJSON();
        this.polygon.setCoordinatesFromGeoJSON(newAndExpectedGeoJSON);
      });

      it('should NOT trigger a "change" event', function () {
        expect(this.changeCallback).not.toHaveBeenCalled();
      });
    });

    describe('when given a GeoJSON with different coordinates', function () {
      beforeEach(function () {
        var newAndExpectedGeoJSON = {
          type: 'Polygon',
          coordinates: [
            [ [ 0, 0 ], [ 10, 10 ], [ 20, 20 ], [ 0, 0 ] ]
          ]
        };
        this.polygon.setCoordinatesFromGeoJSON(newAndExpectedGeoJSON);
        expect(this.polygon.toGeoJSON()).toEqual(newAndExpectedGeoJSON);
      });

      it('should trigger a "change" event', function () {
        expect(this.changeCallback).toHaveBeenCalled();
      });

      it('should update the coordinates', function () {
        expect(this.polygon.toGeoJSON()).toEqual({
          type: 'Polygon',
          coordinates: [
            [ [ 0, 0 ], [ 10, 10 ], [ 20, 20 ], [ 0, 0 ] ]
          ]
        });
      });
    });
  });
});
