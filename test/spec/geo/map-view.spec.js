var $ = require('jquery');
var Backbone = require('backbone');
var VisModel = require('../../../src/vis/vis');
var Map = require('../../../src/geo/map');
var MapView = require('../../../src/geo/map-view');
var TileLayer = require('../../../src/geo/map/tile-layer');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var CartoDBLayerGroup = require('../../../src/geo/cartodb-layer-group');

var LayerGroupModel = CartoDBLayerGroup;

var fakeLayerViewFactory = {
  createLayerView: function () {
    var layerView = new Backbone.View();
    layerView.setCursor = jasmine.createSpy('setCursor');
    spyOn(layerView, 'remove');
    return layerView;
  }
};

var MyMapView = MapView.extend({
  getSize: function () { return { x: 1000, y: 1000 }; },
  _getLayerViewFactory: function () {
    return fakeLayerViewFactory;
  },
  _createNativeMap: function () {}
});

describe('core/geo/map-view', function () {
  beforeEach(function () {
    this.container = $('<div>').css('height', '200px');
    this.vis = new VisModel();
    spyOn(this.vis, 'reload');

    this.map = new Map(null, {
      layersFactory: {}
    });

    this.layerViewFactory = jasmine.createSpyObj('layerViewFactory', ['createLayerView']);
    this.mapView = new MyMapView({
      el: this.container,
      mapModel: this.map,
      visModel: new Backbone.Model(),
      layerGroupModel: new LayerGroupModel(null, {
        layersCollection: this.map.layers
      })
    });
    spyOn(this.mapView, 'setCursor');
    spyOn(this.mapView, 'getNativeMap');
    spyOn(this.mapView, '_addLayerToMap');
  });

  describe('.render', function () {
    it('should add layer views to the map', function () {
      var tileLayer = new TileLayer(null, { vis: {} });
      var cartoDBLayer1 = new CartoDBLayer({}, { vis: this.vis });
      var cartoDBLayer2 = new CartoDBLayer({}, { vis: this.vis });

      this.map.layers.reset([tileLayer, cartoDBLayer1, cartoDBLayer2]);

      this.mapView = new MyMapView({
        el: this.container,
        mapModel: this.map,
        visModel: new Backbone.Model(),
        layerGroupModel: new LayerGroupModel(null, {
          windshaftMap: this.windshaftMap,
          layersCollection: this.map.layers
        })
      });
      spyOn(this.mapView, 'getNativeMap');
      spyOn(this.mapView, '_addLayerToMap');

      this.mapView.render();

      expect(this.mapView._addLayerToMap.calls.count()).toEqual(2);
      expect(this.mapView.getLayerViewByLayerCid(cartoDBLayer1.cid)).toBeDefined();
      expect(this.mapView.getLayerViewByLayerCid(cartoDBLayer2.cid)).toBeDefined();
      expect(this.mapView.getLayerViewByLayerCid(tileLayer.cid)).toBeDefined();

      // Both CartoDBLayer layers share the same layer view
      expect(this.mapView.getLayerViewByLayerCid(cartoDBLayer1.cid)).toEqual(this.mapView.getLayerViewByLayerCid(cartoDBLayer2.cid));

      // Tile Layer has a different layer view
      expect(this.mapView.getLayerViewByLayerCid(tileLayer.cid)).not.toEqual(this.mapView.getLayerViewByLayerCid(cartoDBLayer1.cid));
    });
  });

  describe('bindings to map', function () {
    it('should fitBounds when view bounds change', function () {
      spyOn(this.map, 'fitBounds');

      this.map.setBounds([ [0, 0], [180, 180] ]);
      expect(this.map.fitBounds).toHaveBeenCalled();
    });
  });

  describe('bindings to map.layers', function () {
    describe('when layers of map.layers are resetted', function () {
      it('should group CartoDB layers into a single layerView and add one layerView for each non-CartoDB layer', function () {
        var tileLayer = new TileLayer(null, { vis: {} });
        var cartoDBLayer1 = new CartoDBLayer({}, { vis: this.vis });
        var cartoDBLayer2 = new CartoDBLayer({}, { vis: this.vis });

        this.map.layers.reset([tileLayer, cartoDBLayer1, cartoDBLayer2]);
        expect(this.mapView._addLayerToMap.calls.count()).toEqual(2);

        expect(this.mapView.getLayerViewByLayerCid(cartoDBLayer1.cid)).toBeDefined();
        expect(this.mapView.getLayerViewByLayerCid(cartoDBLayer2.cid)).toBeDefined();
        expect(this.mapView.getLayerViewByLayerCid(tileLayer.cid)).toBeDefined();

        // Both CartoDBLayer layers share the same layer view
        expect(this.mapView.getLayerViewByLayerCid(cartoDBLayer1.cid)).toEqual(this.mapView.getLayerViewByLayerCid(cartoDBLayer2.cid));

        // Tile Layer has a different layer view
        expect(this.mapView.getLayerViewByLayerCid(tileLayer.cid)).not.toEqual(this.mapView.getLayerViewByLayerCid(cartoDBLayer1.cid));
      });

      it('should trigger a "newLayerView" event for each new layerView', function () {
        var callback = jasmine.createSpy('callback');
        this.mapView.on('newLayerView', callback);

        var tileLayer = new TileLayer(null, { vis: {} });
        var cartoDBLayer1 = new CartoDBLayer({}, { vis: this.vis });
        var cartoDBLayer2 = new CartoDBLayer({}, { vis: this.vis });

        this.map.layers.reset([tileLayer, cartoDBLayer1, cartoDBLayer2]);

        expect(callback.calls.count()).toEqual(2);
        expect(callback.calls.argsFor(0)[0]).toEqual(this.mapView.getLayerViewByLayerCid(tileLayer.cid));
        expect(callback.calls.argsFor(1)[0]).toEqual(this.mapView.getLayerViewByLayerCid(cartoDBLayer1.cid));
      });
    });

    describe('when new layerModels are added to map.layers', function () {
      it('should add a new layer view to the map', function () {
        var layer1 = new CartoDBLayer({}, { vis: this.vis });

        this.map.addLayer(layer1);

        var layerViewForLayer1 = this.mapView.getLayerViewByLayerCid(layer1.cid);
        expect(layerViewForLayer1).toBeDefined();
        expect(Object.keys(this.mapView._layerViews).length).toEqual(1);
        expect(this.mapView._addLayerToMap).toHaveBeenCalled();
      });

      it('should group CartoDB layers into a single layerView', function () {
        var tileLayer = new TileLayer(null, { vis: {} });
        var cartoDBLayer1 = new CartoDBLayer({}, { vis: this.vis });
        var cartoDBLayer2 = new CartoDBLayer({}, { vis: this.vis });

        this.map.addLayer(tileLayer);
        expect(this.mapView._addLayerToMap).toHaveBeenCalled();
        this.mapView._addLayerToMap.calls.reset();

        this.map.addLayer(cartoDBLayer1);
        expect(this.mapView._addLayerToMap).toHaveBeenCalled();
        this.mapView._addLayerToMap.calls.reset();

        this.map.addLayer(cartoDBLayer2);
        expect(this.mapView._addLayerToMap).not.toHaveBeenCalled();

        // There are only two layerViews cause the CartoDBLayers have been grouped
        expect(Object.keys(this.mapView._layerViews).length).toEqual(3);
        expect(this.mapView.getLayerViewByLayerCid(cartoDBLayer1.cid)).toBeDefined();
        expect(this.mapView.getLayerViewByLayerCid(cartoDBLayer2.cid)).toBeDefined();
        expect(this.mapView.getLayerViewByLayerCid(tileLayer.cid)).toBeDefined();

        // Both CartoDBLayer layers share the same layer view
        expect(this.mapView.getLayerViewByLayerCid(cartoDBLayer1.cid)).toEqual(this.mapView.getLayerViewByLayerCid(cartoDBLayer2.cid));

        // Tile Layer has a different layer view
        expect(this.mapView.getLayerViewByLayerCid(tileLayer.cid)).not.toEqual(this.mapView.getLayerViewByLayerCid(cartoDBLayer1.cid));
      });

      it('should trigger a "newLayerView" event for each new layerView', function () {
        var callback = jasmine.createSpy('callback');
        this.mapView.on('newLayerView', callback);

        var tileLayer = new TileLayer(null, { vis: {} });
        var cartoDBLayer1 = new CartoDBLayer({}, { vis: this.vis });
        var cartoDBLayer2 = new CartoDBLayer({}, { vis: this.vis });

        this.map.addLayer(tileLayer);
        this.map.addLayer(cartoDBLayer1);
        this.map.addLayer(cartoDBLayer2);

        expect(callback.calls.count()).toEqual(2);
        expect(callback.calls.argsFor(0)[0]).toEqual(this.mapView.getLayerViewByLayerCid(tileLayer.cid));
        expect(callback.calls.argsFor(1)[0]).toEqual(this.mapView.getLayerViewByLayerCid(cartoDBLayer1.cid));
      });
    });

    describe('when layerModels are removed from map.layers', function () {
      it('should should remove the corresponding layerView for layers that are rendered individually (not grouped)', function () {
        var tileLayer = new TileLayer(null, { vis: {} });

        this.map.layers.reset([tileLayer]);

        var tileLayerView = this.mapView.getLayerViewByLayerCid(tileLayer.cid);
        expect(tileLayerView).toBeDefined();

        this.map.layers.remove(tileLayer);

        // View for the tileLayer has been removed
        expect(tileLayerView.remove).toHaveBeenCalled();
        expect(this.mapView.getLayerViewByLayerCid(tileLayer.cid)).not.toBeDefined();
      });

      it('should should only remove a group layerView when all grouped layerModels have been removed', function () {
        var cartoDBLayer1 = new CartoDBLayer({}, { vis: this.vis });
        var cartoDBLayer2 = new CartoDBLayer({}, { vis: this.vis });

        this.map.layers.reset([cartoDBLayer1, cartoDBLayer2]);

        expect(this.mapView.getLayerViewByLayerCid(cartoDBLayer1.cid)).toBeDefined();
        expect(this.mapView.getLayerViewByLayerCid(cartoDBLayer2.cid)).toBeDefined();
        expect(this.mapView.getLayerViewByLayerCid(cartoDBLayer1.cid)).toEqual(this.mapView.getLayerViewByLayerCid(cartoDBLayer2.cid));

        var cartoDBLayerGroupView = this.mapView.getLayerViewByLayerCid(cartoDBLayer1.cid);

        this.map.layers.remove(cartoDBLayer1);

        // There's one more CartoDBLayer so the layer view has not been removed
        // this.mapView.getLayerViewByLayerCid(cartoDBLayer1.cid)
        expect(cartoDBLayerGroupView.remove).not.toHaveBeenCalled();
        expect(this.mapView.getLayerViewByLayerCid(cartoDBLayer1.cid)).not.toBeDefined();
        expect(this.mapView.getLayerViewByLayerCid(cartoDBLayer2.cid)).toBeDefined();

        this.map.layers.remove(cartoDBLayer2);

        // There's one more CartoDBLayer so the layer view has not been removed
        expect(cartoDBLayerGroupView.remove).toHaveBeenCalled();
        expect(this.mapView.getLayerViewByLayerCid(cartoDBLayer2.cid)).not.toBeDefined();
      });

      it('should be able to add a layer after removing it', function () {
        var cartoDBLayer = new CartoDBLayer({}, { vis: this.vis });

        this.map.layers.reset([cartoDBLayer]);

        var cartodbLayerView = this.mapView.getLayerViewByLayerCid(cartoDBLayer.cid);
        expect(cartodbLayerView).toBeDefined();
        expect(this.mapView.getLayerViewByLayerCid(cartoDBLayer.cid)).toBeDefined();

        // Remove the layer
        this.map.layers.remove(cartoDBLayer);

        // View for the cartodbLayer has been removed
        expect(cartodbLayerView.remove).toHaveBeenCalled();
        expect(this.mapView.getLayerViewByLayerCid(cartoDBLayer.cid)).not.toBeDefined();

        this.map.layers.add(cartoDBLayer);
        expect(this.mapView.getLayerViewByLayerCid(cartoDBLayer.cid)).toBeDefined();
      });
    });
  });
});
