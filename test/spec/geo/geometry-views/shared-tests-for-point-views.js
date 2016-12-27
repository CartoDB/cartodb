var _ = require('underscore');
var Point = require('../../../../src/geo/geometry-models/point.js');
var createMapView = require('./create-map-view');

module.exports = function (MapView, PointView) {
  beforeEach(function () {
    spyOn(_, 'debounce').and.callFake(function (func) { return function () { func.apply(this, arguments); }; });

    this.point = new Point({
      latlng: [
        -40,
        40
      ]
    });
    this.mapView = createMapView(MapView);
    this.mapView.render();

    this.pointView = new PointView({
      model: this.point,
      mapView: this.mapView
    });

    this.pointView.render();
  });

  it('should add a marker to the map', function () {
    var markers = this.mapView.getMarkers();
    expect(markers.length).toEqual(1);
    expect(markers[0].getCoordinates()).toEqual({
      lat: -40,
      lng: 40
    });
    expect(markers[0].isDraggable()).toBe(false);
  });

  it('should add a marker to the map when the model gets a lat and lng', function () {
    this.point = new Point();
    this.mapView = createMapView(MapView);
    this.mapView.render();

    this.pointView = new PointView({
      model: this.point,
      mapView: this.mapView
    });

    this.pointView.render();

    var markers = this.mapView.getMarkers();
    expect(markers.length).toEqual(0);

    this.point.set('latlng', [ -45, 45 ]);

    markers = this.mapView.getMarkers();
    expect(markers.length).toEqual(1);
  });

  describe('when the model is updated', function () {
    it("should update the marker's latlng", function () {
      var markers = this.mapView.getMarkers();
      expect(markers.length).toEqual(1);
      expect(markers[0].getCoordinates()).toEqual({
        lat: -40,
        lng: 40
      });

      this.point.set('latlng', [ -45, 45 ]);

      markers = this.mapView.getMarkers();
      expect(markers.length).toEqual(1);
      expect(markers[0].getCoordinates()).toEqual({
        lat: -45,
        lng: 45
      });
    });
  });

  describe('when the model is removed', function () {
    it('should remove the marker if model is removed', function () {
      expect(this.mapView.getMarkers().length).toEqual(1);

      this.point.remove();

      expect(this.mapView.getMarkers().length).toEqual(0);
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

      this.mapView = createMapView(MapView);
      this.mapView.render();

      this.pointView = new PointView({
        model: this.point,
        mapView: this.mapView
      });

      this.pointView.render();
      this.marker = this.mapView.getMarkers()[0];
    });

    it('should add an editable marker to the map', function () {
      expect(this.marker.isDraggable()).toBe(true);
    });

    it("should update model's latlng when the marker is dragged & dropped", function () {
      spyOn(this.marker, 'getCoordinates').and.returnValue({
        lat: -90,
        lng: 90
      });

      this.marker.trigger('dragstart');
      this.marker.trigger('drag');
      this.marker.trigger('dragend');

      expect(this.point.getCoordinates()).toEqual([ -90, 90 ]);
    });

    it("shouldn't update the marker's latlng while dragging", function () {
      this.marker.trigger('dragstart');

      this.point.set('latlng', [
        -50,
        50
      ]);

      expect(this.marker.getCoordinates().lat).toEqual(-40);
      expect(this.marker.getCoordinates().lng).toEqual(40);

      this.marker.trigger('drag');
      this.marker.trigger('dragend');

      this.point.set('latlng', [
        -50,
        50
      ]);

      expect(this.marker.getCoordinates().lat).toEqual(-50);
      expect(this.marker.getCoordinates().lng).toEqual(50);
    });

    it('should bind marker events', function () {
      var callback = jasmine.createSpy('callback');
      var marker = this.mapView.getMarkers()[0];

      this.pointView.on('mousedown', callback);
      marker.trigger('mousedown');

      expect(callback).toHaveBeenCalled();
    });

    it('should unbind marker events when the view is cleaned', function () {
      var callback = jasmine.createSpy('callback');
      var marker = this.mapView.getMarkers()[0];

      this.pointView.on('mousedown', callback);
      this.pointView.clean();

      marker.trigger('mousedown');

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('.clean', function () {
    it('should remove the marker from the map', function () {
      var markers = this.mapView.getMarkers();
      expect(markers.length).toEqual(1);

      this.pointView.clean();

      markers = this.mapView.getMarkers();
      expect(markers.length).toEqual(0);
    });
  });
};
