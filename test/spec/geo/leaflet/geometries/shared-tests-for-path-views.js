var Point = require('../../../../../src/geo/geometry-models/point.js');

module.exports = function () {
  beforeEach(function () {
    if (!this.geometry) throw new Error('geometry is required');
    if (!this.geometryView) throw new Error('geometryView is required');
    if (!this.leafletMap) throw new Error('leafletMap is required');

    this.geometryView.render();

    this.leafletMarker1 = this.leafletMap.addLayer.calls.argsFor(0)[0];
    this.leafletMarker2 = this.leafletMap.addLayer.calls.argsFor(1)[0];
    this.leafletMarker3 = this.leafletMap.addLayer.calls.argsFor(2)[0];
    this.leafletPolygon = this.leafletMap.addLayer.calls.argsFor(3)[0];
  });

  it('should render some markers and a polygon', function () {
    expect(this.leafletMap.addLayer).toHaveBeenCalled();
    expect(this.leafletMap.addLayer.calls.count()).toEqual(4); // 3 markers and 1 polygon
    expect(this.leafletMarker1.getLatLng()).toEqual({ lat: -1, lng: 1 });
    expect(this.leafletMarker1.options.draggable).toBe(false);
    expect(this.leafletMarker2.getLatLng()).toEqual({ lat: 1, lng: 2 });
    expect(this.leafletMarker2.options.draggable).toBe(false);
    expect(this.leafletMarker3.getLatLng()).toEqual({ lat: 3, lng: 4 });
    expect(this.leafletMarker3.options.draggable).toBe(false);
    expect(this.leafletPolygon.getLatLngs()).toEqual([
      { lat: -1, lng: 1 }, { lat: 1, lng: 2 }, { lat: 3, lng: 4 }
    ]);
  });

  it('should not render duplicated markers', function () {
    this.leafletMap.addLayer.calls.reset();
    this.geometry.setCoordinates([
      [-1, 1], [1, 2], [3, 4], [-1, 1]
    ]);

    expect(this.leafletMap.addLayer.calls.count()).toEqual(4); // 3 markers and 1 polygon
  });

  describe('when the model is updated', function () {
    describe('when a point changed', function () {
      beforeEach(function () {
        this.geometry.points.at(0).set('latlng', [ -45, 45 ]);
      });

      it("should update the polygon's latlng", function () {
        expect(this.geometry.getCoordinates()).toEqual([
          [ -45, 45 ], [ 1, 2 ], [ 3, 4 ]
        ]);
      });
    });

    describe('when points are added, function', function () {
      beforeEach(function () {
        var point = new Point({
          latlng: [
            -40,
            40
          ]
        });
        this.geometry.points.add(point);
      });

      it("should update the polygon's latlng", function () {
        expect(this.geometry.getCoordinates()).toEqual([
          [ -1, 1 ], [ 1, 2 ], [ 3, 4 ], [ -40, 40 ]
        ]);
      });
    });

    describe('when points are resetted, function', function () {
      beforeEach(function () {
        this.geometry.setCoordinates([
          [ -10, 10 ], [ 10, 20 ], [ 30, 40 ]
        ]);
      });

      it("should update the polygon's latlng", function () {
        expect(this.geometry.getCoordinates()).toEqual([
          [ -10, 10 ], [ 10, 20 ], [ 30, 40 ]
        ]);
      });
    });
  });

  describe('when the model is removed', function () {
    it('should remove the markers and polygon from the map', function () {
      this.geometry.remove();

      expect(this.leafletMap.removeLayer.calls.count()).toEqual(4); // 3 markers and 1 polygon
    });

    it('should remove each point from the polygon', function () {
      this.geometry.points.each(function (point) {
        spyOn(point, 'remove');
      });

      this.geometry.remove();

      expect(this.geometry.points.all(function (point) {
        return point.remove.calls.count() === 1;
      })).toBe(true);
    });

    it('should remove the view', function () {
      spyOn(this.geometryView, 'remove');

      this.geometry.remove();

      expect(this.geometryView.remove).toHaveBeenCalled();
    });
  });
};
