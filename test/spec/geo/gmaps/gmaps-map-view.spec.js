/* global google */
var $ = require('jquery');
var Backbone = require('backbone');
var Map = require('../../../../src/geo/map');
var GoogleMapsMapView = require('../../../../src/geo/gmaps/gmaps-map-view');

describe('geo/gmaps/gmaps-map-view', function () {
  var mapView;
  var map;
  var spy;
  var container;

  beforeEach(function () {
    container = $('<div>').css('height', '200px');
    map = new Map(null, {
      layersFactory: {}
    });

    spyOn(map, 'setMapViewSize').and.callThrough();
    spyOn(map, 'setPixelToLatLngConverter').and.callThrough();
    spyOn(map, 'setLatLngToPixelConverter').and.callThrough();

    mapView = new GoogleMapsMapView({
      el: container,
      mapModel: map,
      visModel: new Backbone.Model(),
      layerGroupModel: new Backbone.Model()
    });

    mapView.render();

    spy = jasmine.createSpyObj('spy', ['zoomChanged', 'centerChanged', 'scrollWheelChanged']);
    map.bind('change:zoom', spy.zoomChanged);
    map.bind('change:center', spy.centerChanged);
    map.bind('change:scrollwheel', spy.scrollWheelChanged);
  });

  it('should change zoom', function () {
    mapView._setZoom(null, 10);
    expect(spy.zoomChanged).toHaveBeenCalled();
  });

  it('should disable gmaps dragging and double click zooming when the map has drag disabled', function () {
    var container = $('<div>').css({
      'height': '200px',
      'width': '200px'
    });
    var map = new Map({
      drag: false
    }, {
      layersFactory: {}
    });
    var mapView = new GoogleMapsMapView({
      el: container,
      mapModel: map,
      visModel: new Backbone.Model(),
      layerGroupModel: new Backbone.Model()
    });
    mapView.render();

    expect(mapView._gmapsMap.get('draggable')).toBeFalsy();
    expect(mapView._gmapsMap.get('disableDoubleClickZoom')).toBeTruthy();
  });

  it('should change center and zoom when bounds are changed', function (done) {
    var spy = jasmine.createSpy('change:center');
    mapView.getSize = function () { return {x: 200, y: 200}; };
    map.bind('change:center', spy);
    spyOn(mapView, '_setCenter');
    mapView._bindModel();

    map.set({
      'view_bounds_ne': [1, 1],
      'view_bounds_sw': [-0.3, -1.2]
    });

    setTimeout(function () {
      expect(mapView._setCenter).toHaveBeenCalled();
      done();
    }, 1000);
  });

  it('should "forward" a dragend event to the map model', function () {
    var container = $('<div>').css({
      'height': '200px',
      'width': '200px'
    });
    var map = new Map({
      drag: false
    }, {
      layersFactory: {}
    });
    var mapView = new GoogleMapsMapView({
      el: container,
      mapModel: map,
      visModel: new Backbone.Model(),
      layerGroupModel: new Backbone.Model()
    });
    mapView.render();

    spyOn(map, 'trigger');
    spyOn(mapView, 'trigger');

    google.maps.event.trigger(mapView._gmapsMap, 'dragend');

    expect(map.trigger).toHaveBeenCalledWith('moveend', jasmine.any(Object));

    map.trigger.calls.reset();
    mapView.trigger.calls.reset();

    google.maps.event.trigger(mapView._gmapsMap, 'zoom_changed');

    expect(map.trigger).toHaveBeenCalledWith('moveend', jasmine.any(Object));

    map.trigger.calls.reset();
    mapView.trigger.calls.reset();
  });

  it('should set mapview size when bounds changes', function () {
    google.maps.event.trigger(mapView._gmapsMap, 'bounds_changed');
    expect(map.setMapViewSize).toHaveBeenCalled();
  });

  describe('converters', function () {
    it('should set converters', function () {
      expect(map.setPixelToLatLngConverter).toHaveBeenCalled();
      expect(map.setLatLngToPixelConverter).toHaveBeenCalled();
      expect(map._pixelToLatLngConverter).toBeDefined();
      expect(map._latLngToPixelConverter).toBeDefined();
    });

    it('should call native methods', function () {
      spyOn(mapView.projector, 'latLngToPixel').and.callThrough();
      spyOn(mapView.projector, 'pixelToLatLng').and.callThrough();

      var pixelToLatLng = map.pixelToLatLng();
      pixelToLatLng({x: 0, y: 0});
      expect(mapView.projector.pixelToLatLng).toHaveBeenCalled();

      var latLngToPixel = map.latLngToPixel();
      latLngToPixel([0, 0]);
      expect(mapView.projector.latLngToPixel).toHaveBeenCalled();
    });
  });
});
