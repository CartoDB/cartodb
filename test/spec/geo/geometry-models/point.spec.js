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
    beforeEach(function () {
      this.changeCallback = jasmine.createSpy('changeCallback');
      this.point.on('change', this.changeCallback);
    });

    describe('when given a GeoJSON with the same coordinates', function () {
      beforeEach(function () {
        var newAndExpectedGeoJSON = this.point.toGeoJSON();
        this.point.setCoordinatesFromGeoJSON(newAndExpectedGeoJSON);
      });

      it('should NOT trigger a "change" event', function () {
        expect(this.changeCallback).not.toHaveBeenCalled();
      });
    });

    describe('when given a GeoJSON with different coordinates', function () {
      beforeEach(function () {
        var newAndExpectedGeoJSON = {
          type: 'Point',
          coordinates: [ 0, 300 ]
        };
        this.point.setCoordinatesFromGeoJSON(newAndExpectedGeoJSON);
        expect(this.point.toGeoJSON()).toEqual(newAndExpectedGeoJSON);
      });

      it('should trigger a "change" event', function () {
        expect(this.changeCallback).toHaveBeenCalled();
      });

      it('should update the coordinates', function () {
        expect(this.point.toGeoJSON()).toEqual({
          type: 'Point',
          coordinates: [ 0, 300 ]
        });
      });
    });
  });
});
