var _ = require('underscore');
var PointView = require('../../../../../src/geo/leaflet/geometries/point-view.js');
var Point = require('../../../../../src/geo/geometry-models/point.js');

describe('src/geo/leaflet/geometries/point-view.js', function () {
  beforeEach(function () {
    spyOn(_, 'debounce').and.callFake(function (func) { return function () { func.apply(this, arguments); }; });

    this.point = new Point({
      latlng: [
        -40,
        40
      ]
    });
    this.leafletMap = jasmine.createSpyObj('leafletMap', [ 'addLayer', 'removeLayer' ]);

    this.pointView = new PointView({
      model: this.point,
      nativeMap: this.leafletMap
    });

    this.pointView.render();
  });

  it('should add a marker to the map', function () {
    expect(this.leafletMap.addLayer).toHaveBeenCalled();
    var marker = this.leafletMap.addLayer.calls.argsFor(0)[0];
    expect(marker.getLatLng()).toEqual({
      lat: -40,
      lng: 40
    });
    expect(marker.options.draggable).toBe(false);
  });

  describe('when the model is updated', function () {
    it("should update the marker's latlng", function () {
      var marker = this.leafletMap.addLayer.calls.argsFor(0)[0];

      this.point.set('latlng', [ -45, 45 ]);

      expect(marker.getLatLng()).toEqual({
        lat: -45,
        lng: 45
      });
    });
  });

  describe('when the model is removed', function () {
    it('should remove the marker if model is removed', function () {
      this.point.remove();

      expect(this.leafletMap.removeLayer).toHaveBeenCalled();
    });

    it('should remove the view', function () {
      spyOn(this.pointView, 'remove');

      this.point.remove();

      expect(this.pointView.remove).toHaveBeenCalled();
    });
  });

  describe('editable points', function () {
    beforeEach(function () {
      this.point = new Point({
        latlng: [
          -40,
          40
        ],
        editable: true
      });

      this.pointView = new PointView({
        model: this.point,
        nativeMap: this.leafletMap
      });

      this.leafletMap.addLayer.calls.reset();
      this.pointView.render();
      this.marker = this.leafletMap.addLayer.calls.argsFor(0)[0];
    });

    it('should add an editable marker to the map', function () {
      expect(this.marker.options.draggable).toBe(true);
    });

    it("should update model's latlng when the marker is dragged & dropped", function () {
      spyOn(this.marker, 'getLatLng').and.returnValue({
        lat: -90,
        lng: 90
      });

      this.marker.fire('dragstart');
      this.marker.fire('drag');
      this.marker.fire('dragend');

      expect(this.point.get('latlng')).toEqual([ -90, 90 ]);
    });

    it("shouldn't update the marker's latlng while dragging", function () {
      this.marker.fire('dragstart');

      this.point.set('latlng', [
        -50,
        50
      ]);

      expect(this.marker.getLatLng().lat).toEqual(-40);
      expect(this.marker.getLatLng().lng).toEqual(40);

      this.marker.fire('drag');
      this.marker.fire('dragend');

      this.point.set('latlng', [
        -50,
        50
      ]);

      expect(this.marker.getLatLng().lat).toEqual(-50);
      expect(this.marker.getLatLng().lng).toEqual(50);
    });
  });
});
