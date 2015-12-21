var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var L = require('leaflet');
global.L = L;
var config = require('cdb.config');
var log = require('cdb.log');
var Map = require('../../../../src/geo/map');
var LeafletMapView = require('../../../../src/geo/leaflet/leaflet-map-view');
var TileLayer = require('../../../../src/geo/map/tile-layer');
var LeafletTiledLayerView = require('../../../../src/geo/leaflet/leaflet-tiled-layer-view');
var LeafletCartoDBLayerGroupView = require('../../../../src/geo/leaflet/leaflet-cartodb-layer-group-view');
var CartoDBLayerGroupNamed = require('../../../../src/geo/map/cartodb-layer-group-named');
var CartoDBLayerGroupAnonymous = require('../../../../src/geo/map/cartodb-layer-group-anonymous');
var PlainLayer = require('../../../../src/geo/map/plain-layer');
var LeafletPlainLayerView = require('../../../../src/geo/leaflet/leaflet-plain-layer-view');
var Geometry = require('../../../../src/geo/geometry');
var GMapsBaseLayer = require('../../../../src/geo/map/gmaps-base-layer');
var TorqueLayer = require('../../../../src/geo/map/torque-layer');

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
    map = new Map();
    mapView = new LeafletMapView({
      el: container,
      map: map
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

  it('should create a layer view when adds a model', function () {
    var spy = { c: function () {} };
    spyOn(spy, 'c');
    mapView.bind('newLayerView', spy.c);
    map.addLayer(layer);
    expect(map.layers.length).toEqual(1);
    expect(_.size(mapView.layers)).toEqual(1);
    expect(spy.c).toHaveBeenCalled();
  });

  it('should allow removing a layer', function () {
    map.addLayer(layer);
    map.removeLayer(layer);
    expect(map.layers.length).toEqual(0);
    expect(_.size(mapView.layers)).toEqual(0);
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
    var layerView = mapView.getLayerByCid(lyr);
    expect(LeafletTiledLayerView.prototype.isPrototypeOf(layerView)).isPrototypeOf();
  });

  it('should create a LeafletCartoDBLayerGroupView when the layer is CartoDBLayerGroupAnonymous', function () {
    layer = new CartoDBLayerGroupAnonymous({}, {});
    var lyr = map.addLayer(layer);
    var layerView = mapView.getLayerByCid(lyr);
    expect(layerView instanceof LeafletCartoDBLayerGroupView).toBeTruthy();
  });

  it('should create a LeafletCartoDBLayerGroupView when the layer is CartoDBLayerGroupNamed', function () {
    layer = new CartoDBLayerGroupNamed({}, {});
    var lyr = map.addLayer(layer);
    var layerView = mapView.getLayerByCid(lyr);
    expect(layerView instanceof LeafletCartoDBLayerGroupView).toBeTruthy();
  });

  it('should create a PlaiLayer when the layer is cartodb', function () {
    layer = new PlainLayer({});
    var lyr = map.addLayer(layer);
    var layerView = mapView.getLayerByCid(lyr);
    expect(layerView.setQuery).not.toEqual(LeafletPlainLayerView);
  });

  it('should insert layers in specified order', function () {
    var tileLayer = new TileLayer({urlTemplate: 'test' });
    map.addLayer(tileLayer);

    var tileLayer2 = new TileLayer({urlTemplate: 'test' });
    map.addLayer(tileLayer2, { at: 0 });

    expect(mapView.getLayerByCid(tileLayer.cid).options.zIndex).toEqual(1);
    expect(mapView.getLayerByCid(tileLayer2.cid).options.zIndex).toEqual(0);
  });

  it('should remove all layers when map view is cleaned', function () {
    var id1 = map.addLayer(new CartoDBLayerGroupAnonymous({}, {}));
    var id2 = map.addLayer(new CartoDBLayerGroupAnonymous({}, {}));

    expect(_.size(mapView.layers)).toEqual(2);
    var layer = mapView.getLayerByCid(id1);
    var layer2 = mapView.getLayerByCid(id2);
    spyOn(layer, 'remove');
    spyOn(layer2, 'remove');
    mapView.clean();
    expect(_.size(mapView.layers)).toEqual(0);
    expect(layer.remove).toHaveBeenCalled();
    expect(layer2.remove).toHaveBeenCalled();
  });

  it("should not all a layer when it can't be creadted", function () {
    var layer = new TileLayer({type: 'rambo'});
    map.addLayer(layer);
    expect(_.size(mapView.layers)).toEqual(0);
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
    var layer1 = new TileLayer({ urlTemplate: 'test1'});
    var layer2 = new TileLayer({ urlTemplate: 'test2'});
    var layerView1 = mapView.getLayerByCid(map.addLayer(layer1));
    var layerView2 = mapView.getLayerByCid(map.addLayer(layer2, { at: 0 }));
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
      layerOpts = { base_type: baseType};
      testContext = 'with basemap "' + baseType + '"';
    } else {
      testContext = 'with default basemap "gray_roadmap"';
    }

    describe('given a GMaps layer model ' + testContext, function () {
      var view;

      beforeEach(function () {
        var layer = new GMapsBaseLayer(layerOpts);
        view = mapView.createLayer(layer);
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
      map: map
    });

    expect(mapView.map_leaflet.dragging.enabled()).toBeFalsy();
    expect(mapView.map_leaflet.doubleClickZoom.enabled()).toBeFalsy();
  });

});
