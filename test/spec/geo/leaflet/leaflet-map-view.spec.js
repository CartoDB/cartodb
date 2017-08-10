var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var L = require('leaflet');
global.L = L;

var Map = require('../../../../src/geo/map');
var VisModel = require('../../../../src/vis/vis');
var TileLayer = require('../../../../src/geo/map/tile-layer');
var CartoDBLayer = require('../../../../src/geo/map/cartodb-layer');
var PlainLayer = require('../../../../src/geo/map/plain-layer');
var LayersCollection = require('../../../../src/geo/map/layers');
var CartoDBLayerGroup = require('../../../../src/geo/cartodb-layer-group');
var LeafletMapView = require('../../../../src/geo/leaflet/leaflet-map-view');
var LeafletTiledLayerView = require('../../../../src/geo/leaflet/leaflet-tiled-layer-view');
var LeafletPlainLayerView = require('../../../../src/geo/leaflet/leaflet-plain-layer-view');

describe('geo/leaflet/leaflet-map-view', function () {
  var mapView;
  var map;
  var spy;
  var container;
  var layer;

  beforeEach(function () {
    container = $('<div>').css({
      'height': '200px',
      'width': '200px'
    });

    map = new Map(null, {
      layersFactory: {},
      attribution: [ '© CARTO' ]
    });

    spyOn(map, 'setMapViewSize').and.callThrough();
    spyOn(map, 'setPixelToLatLngConverter').and.callThrough();
    spyOn(map, 'setLatLngToPixelConverter').and.callThrough();

    this.layerGroupModel = new CartoDBLayerGroup({}, { layersCollection: new LayersCollection() });
    spyOn(this.layerGroupModel, 'hasTileURLTemplates').and.returnValue(true);
    spyOn(this.layerGroupModel, 'getTileURLTemplate').and.returnValue('http://documentation.cartodb.com/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/0/{z}/{x}/{y}.png');

    mapView = new LeafletMapView({
      el: container,
      mapModel: map,
      visModel: new Backbone.Model(),
      layerGroupModel: this.layerGroupModel
    });

    mapView.render();

    var layerURL = 'http://{s}.tiles.mapbox.com/v3/cartodb.map-1nh578vv/{z}/{x}/{y}.png';
    layer = new TileLayer({ urlTemplate: layerURL }, { vis: {} });

    spy = jasmine.createSpyObj('spy', ['zoomChanged', 'centerChanged', 'keyboardChanged', 'changed']);
    map.bind('change:zoom', spy.zoomChanged);
    map.bind('change:keyboard', spy.keyboardChanged);
    map.bind('change:center', spy.centerChanged);
    map.bind('change', spy.changed);

    this.vis = new VisModel();
  });

  it('should change bounds when center is set', function () {
    var spy = jasmine.createSpy('change:view_bounds_ne');
    spyOn(map, 'getViewBounds');
    map.bind('change:view_bounds_ne', spy);
    map.set('center', [10, 10]);
    expect(spy).toHaveBeenCalled();
    expect(map.getViewBounds).not.toHaveBeenCalled();
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
    expect(LeafletTiledLayerView.prototype.isPrototypeOf(layerView)).isPrototypeOf();
  });

  it('should create a PlainLayer when the layer is cartodb', function () {
    layer = new PlainLayer(null, { vis: {} });
    var lyr = map.addLayer(layer);
    var layerView = mapView.getLayerViewByLayerCid(lyr);
    expect(layerView.setQuery).not.toEqual(LeafletPlainLayerView);
  });

  it('should insert layers in specified order', function () {
    var tileLayer = new TileLayer({ urlTemplate: 'http://tilelayer1.com' }, { vis: {} });
    map.addLayer(tileLayer);

    var tileLayer2 = new TileLayer({ urlTemplate: 'http://tilelayer2.com' }, { vis: {} });
    map.addLayer(tileLayer2, { at: 0 });

    expect(mapView.getLayerViewByLayerCid(tileLayer.cid).leafletLayer.options.zIndex).toEqual(1);
    expect(mapView.getLayerViewByLayerCid(tileLayer2.cid).leafletLayer.options.zIndex).toEqual(0);
  });

  it('should remove all layers when map view is cleaned', function () {
    var cartoDBLayer1 = new CartoDBLayer({ meta: { cartocss: '#layer {}' } }, { vis: this.vis });
    var cartoDBLayer2 = new CartoDBLayer({ meta: { cartocss: '#layer {}' } }, { vis: this.vis });
    var tileLayer = new TileLayer({ urlTemplate: 'test' }, { vis: {} });

    map.addLayer(cartoDBLayer1);
    map.addLayer(cartoDBLayer2);
    map.addLayer(tileLayer);

    expect(_.size(mapView._layerViews)).toEqual(3);

    var layerGroupView = mapView.getLayerViewByLayerCid(cartoDBLayer1.cid);
    spyOn(layerGroupView, 'remove');

    var tileLayerView = mapView.getLayerViewByLayerCid(tileLayer.cid);
    spyOn(tileLayerView, 'remove');

    mapView.clean();

    expect(_.size(mapView._layerViews)).toEqual(0);
    expect(layerGroupView.remove).toHaveBeenCalled();
    expect(tileLayerView.remove).toHaveBeenCalled();
    expect(mapView.layerGroupModel).not.toBeDefined();
  });

  it("should not add a layer view when it can't be created", function () {
    var layer = new TileLayer({type: 'rambo'}, { vis: {} });
    map.addLayer(layer);
    expect(_.size(mapView._layerViews)).toEqual(0);
  });

  describe('attributions', function () {
    it('should not render Leaflet attributions', function () {
      var attributions = mapView.$el.find('.leaflet-control-attribution');
      expect(attributions.text()).toEqual('');
    });
  });

  it('should disable leaflet dragging and double click zooming when the map has drag disabled', function () {
    var container = $('<div>').css({
      'height': '200px',
      'width': '200px'
    });
    var map = new Map({
      drag: false
    }, {
      layersFactory: {}
    });
    var mapView = new LeafletMapView({
      el: container,
      mapModel: map,
      visModel: new Backbone.Model(),
      layerGroupModel: new Backbone.Model()
    });
    mapView.render();

    expect(mapView._leafletMap.dragging.enabled()).toBeFalsy();
    expect(mapView._leafletMap.doubleClickZoom.enabled()).toBeFalsy();
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
    var mapView = new LeafletMapView({
      el: container,
      mapModel: map,
      visModel: new Backbone.Model(),
      layerGroupModel: new Backbone.Model()
    });
    mapView.render();

    spyOn(map, 'trigger');

    mapView._leafletMap.fire('moveend');

    expect(map.trigger).toHaveBeenCalledWith('moveend', jasmine.any(Object));
  });

  it('should update mapView size on resize', function () {
    mapView._leafletMap.fire('resize');
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
      spyOn(mapView._leafletMap, 'latLngToContainerPoint').and.callThrough();
      spyOn(mapView._leafletMap, 'containerPointToLatLng').and.callThrough();

      var pixelToLatLng = map.pixelToLatLng();
      pixelToLatLng({x: 0, y: 0});
      expect(mapView._leafletMap.containerPointToLatLng).toHaveBeenCalled();

      var latLngToPixel = map.latLngToPixel();
      latLngToPixel([0, 0]);
      expect(mapView._leafletMap.latLngToContainerPoint).toHaveBeenCalled();
    });
  });

  describe('.invalidateSize', function () {
    it('should invalidate size in Leaflet and "re-center"', function () {
      spyOn(mapView._leafletMap, 'invalidateSize');
      spyOn(mapView._leafletMap, 'setView');
      var center = mapView.map.get('center');
      var zoom = mapView.map.get('zoom');

      mapView.invalidateSize();

      expect(mapView._leafletMap.setView).toHaveBeenCalledWith(center, zoom, jasmine.any(Object));
      expect(mapView._leafletMap.invalidateSize).toHaveBeenCalled();
    });
  });
});
