var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var L = require('leaflet');
global.L = L;

var Map = require('../../../../src/geo/map');
var Geometry = require('../../../../src/geo/geometry');
var TileLayer = require('../../../../src/geo/map/tile-layer');
var CartoDBLayer = require('../../../../src/geo/map/cartodb-layer');
var PlainLayer = require('../../../../src/geo/map/plain-layer');
var GMapsBaseLayer = require('../../../../src/geo/map/gmaps-base-layer');
var LeafletMapView = require('../../../../src/geo/leaflet/leaflet-map-view');
var LeafletLayerViewFactory = require('../../../../src/geo/leaflet/leaflet-layer-view-factory');
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

    // Map needs a WindshaftMap so we're setting up a fake one
    var fakeWindshaftMap = jasmine.createSpyObj('windshaftMap', ['createInstance', 'bind']);

    map = new Map(null, {
      windshaftMap: fakeWindshaftMap
    });
    map.instantiateMap();

    mapView = new LeafletMapView({
      el: container,
      map: map,
      layerViewFactory: new LeafletLayerViewFactory(),
      layerGroupModel: new Backbone.Model({ type: 'layergroup' })
    });

    var layerURL = 'http://{s}.tiles.mapbox.com/v3/cartodb.map-1nh578vv/{z}/{x}/{y}.png';
    layer = new TileLayer({ urlTemplate: layerURL });

    spy = jasmine.createSpyObj('spy', ['zoomChanged', 'centerChanged', 'keyboardChanged', 'changed']);
    map.bind('change:zoom', spy.zoomChanged);
    map.bind('change:keyboard', spy.keyboardChanged);
    map.bind('change:center', spy.centerChanged);
    map.bind('change', spy.changed);
  });

  it('should change bounds when center is set', function () {
    var spy = jasmine.createSpy('change:view_bounds_ne');
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

  it('should trigger an event when a new layerView is added to the map', function () {
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
    expect(LeafletTiledLayerView.prototype.isPrototypeOf(layerView)).isPrototypeOf();
  });

  it('should create a PlainLayer when the layer is cartodb', function () {
    layer = new PlainLayer({});
    var lyr = map.addLayer(layer);
    var layerView = mapView.getLayerViewByLayerCid(lyr);
    expect(layerView.setQuery).not.toEqual(LeafletPlainLayerView);
  });

  it('should insert layers in specified order', function () {
    var tileLayer = new TileLayer({ urlTemplate: 'http://tilelayer1.com' });
    map.addLayer(tileLayer);

    var tileLayer2 = new TileLayer({ urlTemplate: 'http://tilelayer2.com' });
    map.addLayer(tileLayer2, { at: 0 });

    expect(mapView.getLayerViewByLayerCid(tileLayer.cid).options.zIndex).toEqual(1);
    expect(mapView.getLayerViewByLayerCid(tileLayer2.cid).options.zIndex).toEqual(0);
  });

  it('should remove all layers when map view is cleaned', function () {
    var cartoDBLayer1 = new CartoDBLayer();
    var cartoDBLayer2 = new CartoDBLayer();
    var tileLayer = new TileLayer({ urlTemplate: 'test' });

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
    var layer = new TileLayer({type: 'rambo'});
    map.addLayer(layer);
    expect(_.size(mapView._layerViews)).toEqual(0);
  });

  var geojsonFeature = {
    'type': 'Point',
    'coordinates': [-104.99404, 39.75621]
  };

  it('should add and remove a geometry', function () {
    var geo = new Geometry({
      geojson: geojsonFeature
    });
    map.addGeometry(geo);
    expect(_.size(mapView.geometries)).toEqual(1);
    geo.destroy();
    expect(_.size(mapView.geometries)).toEqual(0);
  });

  it('should edit a geometry', function () {
    var geo = new Geometry({
      geojson: geojsonFeature
    });
    map.addGeometry(geo);
    var v = mapView.geometries[geo.cid];
    v.trigger('dragend', null, [10, 20]);
    expect(geo.get('geojson')).toEqual({
      'type': 'Point',
      'coordinates': [20, 10]
    });
  });

  it('should save automatically when the zoom or center changes', function (done) {
    spyOn(map, 'save');
    mapView.setAutoSaveBounds();
    map.set('center', [1, 2]);

    setTimeout(function () {
      expect(map.save).toHaveBeenCalled();
      done();
    }, 1500);
  });

  it('should set z-order', function () {
    var layer1 = new TileLayer({urlTemplate: 'test1'});
    var layer2 = new TileLayer({urlTemplate: 'test2'});
    var layerView1 = mapView.getLayerViewByLayerCid(map.addLayer(layer1));
    var layerView2 = mapView.getLayerViewByLayerCid(map.addLayer(layer2, { at: 0 }));
    expect(layerView1.options.zIndex > layerView2.options.zIndex).toEqual(true);
  });

  // Test cases for gmaps substitutes since the support is deprecated.
  _({ // GMaps basemap base_type: expected substitute data
    // empty = defaults to gray_roadmap
    '': {
      tiles: {
        providedBy: 'cartocdn',
        type: 'light'
      },
      subdomains: ['a', 'b', 'c', 'd'],
      minZoom: 0,
      maxZoom: 18,
      attribution: 'Map designs by <a href="http://stamen.com/">Stamen</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, Provided by <a href="http://cartodb.com">CartoDB</a>'
    },
    dark_roadmap: {
      tiles: {
        providedBy: 'cartocdn',
        type: 'dark'
      },
      subdomains: ['a', 'b', 'c', 'd'],
      minZoom: 0,
      maxZoom: 18,
      attribution: 'Map designs by <a href="http://stamen.com/">Stamen</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, Provided by <a href="http://cartodb.com">CartoDB</a>'
    },
    roadmap: {
      tiles: {
        providedBy: 'nokia',
        type: 'normal.day'
      },
      subdomains: ['1', '2', '3', '4'],
      minZoom: 0,
      maxZoom: 21,
      attribution: '©2012 Nokia <a href="http://here.net/services/terms" target="_blank">Terms of use</a>'
    },
    hybrid: {
      tiles: {
        providedBy: 'nokia',
        type: 'hybrid.day'
      },
      subdomains: ['1', '2', '3', '4'],
      minZoom: 0,
      maxZoom: 21,
      attribution: '©2012 Nokia <a href="http://here.net/services/terms" target="_blank">Terms of use</a>'
    },
    terrain: {
      tiles: {
        providedBy: 'nokia',
        type: 'terrain.day'
      },
      subdomains: ['1', '2', '3', '4'],
      minZoom: 0,
      maxZoom: 21,
      attribution: '©2012 Nokia <a href="http://here.net/services/terms" target="_blank">Terms of use</a>'
    },
    satellite: { // Nokia Satellite Day
      tiles: {
        providedBy: 'nokia',
        type: 'satellite.day'
      },
      subdomains: ['1', '2', '3', '4'],
      minZoom: 0,
      maxZoom: 21,
      attribution: '©2012 Nokia <a href="http://here.net/services/terms" target="_blank">Terms of use</a>'
    }
  }).map(function (substitute, baseType) {
    var layerOpts;
    var testContext;

    if (baseType) {
      layerOpts = {base_type: baseType};
      testContext = 'with basemap "' + baseType + '"';
    } else {
      testContext = 'with default basemap "gray_roadmap"';
    }

    describe('given a GMaps layer model ' + testContext, function () {
      var view;

      beforeEach(function () {
        var layer = new GMapsBaseLayer(layerOpts);
        map.layers.add(layer);
        view = mapView.getLayerViewByLayerCid(layer.cid);
      });

      it("should have a tileUrl based on substitute's template URL", function () {
        var tileUrl = view.getTileUrl({ x: 101, y: 202, z: 303 });

        expect(tileUrl).toContain(substitute.tiles.providedBy);
        expect(tileUrl).toContain(substitute.tiles.type);
      });

      it("should have substitute's attribution", function () {
        expect(view.options.attribution).toEqual(substitute.attribution);
      });

      it("should have substitute's minZoom", function () {
        expect(view.options.minZoom).toEqual(substitute.minZoom);
      });

      it("should have substitute's maxZoom", function () {
        expect(view.options.maxZoom).toEqual(substitute.maxZoom);
      });

      it("shouldn't have any opacity since gmaps basemap didn't have any", function () {
        expect(view.options.opacity).toEqual(1);
      });

      it("should match substitute's subdomains", function () {
        expect(view.options.subdomains).toEqual(substitute.subdomains);
      });

      it("shouldn't have an errorTileUrl since gmaps didn't have any", function () {
        expect(view.options.errorTileUrl).toEqual('');
      });

      it("shouldn't use osgeo's TMS setting", function () {
        expect(view.options.tms).toEqual(false);
      });

      xit('should change keyboard', function () {
        mapView._setKeyboard(null, false);
        expect(spy.keyboardChanged).toHaveBeenCalled();
      });
    });
  });

  describe('attributions', function () {
    var container;

    beforeEach(function () {
      container = $('<div>').css({
        'height': '200px',
        'width': '200px'
      });
    });

    it('should not render Leaflet attributions', function () {
      var attributions = mapView.$el.find('.leaflet-control-attribution');
      expect(attributions.length).toBe(0);
    });

    it('should respect the attribution of existing Leaflet layers', function () {
      var leafletMap = new L.Map(container[0], {
        center: [43, 0],
        zoom: 3
      });

      // Add a tile layer with some attribution
      L.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png', {
        attribution: 'Stamen'
      }).addTo(leafletMap);

      mapView = new LeafletMapView({
        el: container,
        map: map,
        map_object: leafletMap,
        layerViewFactory: new LeafletLayerViewFactory(),
        layerGroupModel: new Backbone.Model({ type: 'layergroup' })
      });

      // Add a CartoDB layer with some custom attribution
      layer = new CartoDBLayer({
        attribution: 'custom attribution'
      });
      map.addLayer(layer);

      var attributions = mapView.$el.find('.leaflet-control-attribution').text();
      expect(attributions).toEqual('Leaflet | Stamen, CartoDB attribution, custom attribution');
    });

    it('should not render attributions when the Leaflet map has attributionControl disabled', function () {
      var leafletMap = new L.Map(container[0], {
        center: [43, 0],
        zoom: 3,
        attributionControl: false
      });

      // Add a tile layer with some attribution
      L.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png', {
        attribution: 'Stamen'
      }).addTo(leafletMap);

      mapView = new LeafletMapView({
        el: container,
        map: map,
        map_object: leafletMap,
        layerViewFactory: new LeafletLayerViewFactory(),
        layerGroupModel: new Backbone.Model({ type: 'layergroup' })
      });

      // Add a CartoDB layer with some custom attribution
      layer = new CartoDBLayer({
        attribution: 'custom attribution'
      });
      map.addLayer(layer);

      var attributions = mapView.$el.find('.leaflet-control-attribution').text();
      expect(attributions).toEqual('');
    });
  });

  it('should disable leaflet dragging and double click zooming when the map has drag disabled', function () {
    var container = $('<div>').css({
      'height': '200px',
      'width': '200px'
    });
    var map = new Map({
      drag: false
    });
    var mapView = new LeafletMapView({
      el: container,
      map: map,
      layerViewFactory: new LeafletLayerViewFactory(),
      layerGroupModel: new Backbone.Model()
    });

    expect(mapView._leafletMap.dragging.enabled()).toBeFalsy();
    expect(mapView._leafletMap.doubleClickZoom.enabled()).toBeFalsy();
  });
});
