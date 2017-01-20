/* global google */
var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var Map = require('../../../../src/geo/map');
var TileLayer = require('../../../../src/geo/map/tile-layer');
var PlainLayer = require('../../../../src/geo/map/plain-layer');
var GoogleMapsMapView = require('../../../../src/geo/gmaps/gmaps-map-view');
var GMapsTiledLayerView = require('../../../../src/geo/gmaps/gmaps-tiled-layer-view');
var GMapsPlainLayerView = require('../../../../src/geo/gmaps/gmaps-plain-layer-view');

describe('geo/gmaps/gmaps-map-view', function () {
  var mapView;
  var map;
  var spy;
  var container;
  var layer;
  beforeEach(function () {
    container = $('<div>').css('height', '200px');
    map = new Map(null, {
      layersFactory: {}
    });
    mapView = new GoogleMapsMapView({
      el: container,
      map: map,
      layerGroupModel: new Backbone.Model()
    });
    mapView.render();

    var layerURL = 'http://localhost/{s}/light_nolabels/{z}/{x}/{y}.png';
    layer = new TileLayer({ urlTemplate: layerURL });

    spy = jasmine.createSpyObj('spy', ['zoomChanged', 'centerChanged', 'scrollWheelChanged']);
    map.bind('change:zoom', spy.zoomChanged);
    map.bind('change:center', spy.centerChanged);
    map.bind('change:scrollwheel', spy.scrollWheelChanged);
  });

  it('should change bounds when center is set', function () {
    var spy = jasmine.createSpy('change:view_bound_ne');
    spyOn(map, 'getViewBounds');
    map.bind('change:view_bounds_ne', spy);
    map.set('center', [10, 10]);
    expect(spy).toHaveBeenCalled();
    expect(map.getViewBounds).not.toHaveBeenCalled();
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

  it('should allow to disable the scroll wheel', function () {
    map.disableScrollWheel();
    expect(spy.scrollWheelChanged).toHaveBeenCalled();
    expect(map.get('scrollwheel')).toEqual(false);
  });

  it('should change zoom', function () {
    mapView._setZoom(null, 10);
    expect(spy.zoomChanged).toHaveBeenCalled();
  });

  it('should allow adding a layer', function () {
    map.addLayer(layer);
    expect(map.layers.length).toEqual(1);
  });

  it('should add layers on reset', function () {
    map.layers.reset([
      layer
    ]);
    expect(map.layers.length).toEqual(1);
  });

  it('should create a layer view when adds a model', function () {
    var spy = { c: function () {} };
    spyOn(spy, 'c');
    mapView.bind('newLayerView', spy.c);
    map.addLayer(layer);
    expect(map.layers.length).toEqual(1);
    expect(_.size(mapView._layerViews)).toEqual(1);
    expect(spy.c).toHaveBeenCalled();
  });

  it('should allow removing a layer', function () {
    map.addLayer(layer);
    map.removeLayer(layer);
    expect(map.layers.length).toEqual(0);
    expect(_.size(mapView._layerViews)).toEqual(0);
  });

  it('should allow removing a layer by index', function () {
    map.addLayer(layer);
    map.removeLayerAt(0);
    expect(map.layers.length).toEqual(0);
  });

  it('should allow removing a layer by Cid', function () {
    var cid = map.addLayer(layer);
    map.removeLayerByCid(cid);
    expect(map.layers.length).toEqual(0);
  });

  it('should create a TiledLayerView when the layer is Tiled', function () {
    var lyr = map.addLayer(layer);
    var layerView = mapView.getLayerViewByLayerCid(lyr);
    expect(GMapsTiledLayerView.prototype.isPrototypeOf(layerView)).toBeTruthy();
  });

  it('should create a PlainLayer when the layer is cartodb', function () {
    layer = new PlainLayer({});
    var lyr = map.addLayer(layer);
    var layerView = mapView.getLayerViewByLayerCid(lyr);
    expect(GMapsPlainLayerView.prototype.isPrototypeOf(layerView)).toBeTruthy();
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
      map: map,
      layerGroupModel: new Backbone.Model()
    });
    mapView.render();

    expect(mapView._gmapsMap.get('draggable')).toBeFalsy();
    expect(mapView._gmapsMap.get('disableDoubleClickZoom')).toBeTruthy();
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
      map: map,
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
});
