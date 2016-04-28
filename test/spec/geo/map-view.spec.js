var $ = require('jquery');
var Backbone = require('backbone');
var Map = require('../../../src/geo/map');
var MapView = require('../../../src/geo/map-view');
var TileLayer = require('../../../src/geo/map/tile-layer');
var CartoDBLayer = require('../../../src/geo/map/cartodb-layer');
var Infowindow = require('../../../src/geo/ui/infowindow-view');
var CartoDBLayerGroupBase = require('../../../src/geo/cartodb-layer-group-base');

var LayerGroupModel = CartoDBLayerGroupBase;

describe('core/geo/map-view', function () {
  beforeEach(function() {
    this.container = $('<div>').css('height', '200px');

    // Map needs a WindshaftMap so we're setting up a fake one
    var windshaftMap = jasmine.createSpyObj('windshaftMap', ['bind', 'createInstance']);

    this.map = new Map(null, {
      windshaftMap: windshaftMap
    });

    this.layerViewFactory = jasmine.createSpyObj('layerViewFactory', ['createLayerView']);
    this.mapView = new MapView({
      el: this.container,
      map: this.map,
      layerViewFactory: this.layerViewFactory,
      layerGroupModel: new LayerGroupModel(null, {
        windshaftMap: windshaftMap,
        layersCollection: this.map.layers
      })
    });

    spyOn(this.mapView, 'getNativeMap');
    spyOn(this.mapView, '_addLayerToMap');
  });

  it('should be able to add a infowindow', function () {
    var infow = new Infowindow({mapView: this.mapView, model: new Backbone.Model()});
    this.mapView.addInfowindow(infow);

    expect(this.mapView._subviews[infow.cid]).toBeTruthy();
    expect(this.mapView._subviews[infow.cid] instanceof Infowindow).toBeTruthy();
  });

  describe('bindings to map.layers', function () {
    describe('when layers of map.layers are resetted', function () {
      it('should group CartoDB layers into a single layerView and add one layerView for each non-CartoDB layer', function () {
        this.layerViewFactory.createLayerView.and.callFake(function () {
          return jasmine.createSpyObj('layerView', ['something']);
        });
        var tileLayer = new TileLayer();
        var cartoDBLayer1 = new CartoDBLayer();
        var cartoDBLayer2 = new CartoDBLayer();

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
    });

    describe('when new layerModels are added to map.layers', function () {
      it('should add a new layer view to the map', function () {
        this.layerViewFactory.createLayerView.and.callFake(function () {
          return jasmine.createSpyObj('layerView', ['something']);
        });
        var layer1 = new CartoDBLayer();

        this.map.addLayer(layer1);

        var layerViewForLayer1 = this.mapView.getLayerViewByLayerCid(layer1.cid);
        expect(layerViewForLayer1).toBeDefined();
        expect(Object.keys(this.mapView._layerViews).length).toEqual(1);
        expect(this.mapView._addLayerToMap).toHaveBeenCalled();
      });

      it('should group CartoDB layers into a single layerView', function () {
        this.layerViewFactory.createLayerView.and.callFake(function () {
          return jasmine.createSpyObj('layerView', ['something']);
        });
        var tileLayer = new TileLayer();
        var cartoDBLayer1 = new CartoDBLayer();
        var cartoDBLayer2 = new CartoDBLayer();

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
    });

    describe('when layerModels are removed from map.layers', function () {
      it('should should remove the corresponding layerView for layers that are rendered individually (not grouped)', function () {
        this.layerViewFactory.createLayerView.and.callFake(function () {
          return jasmine.createSpyObj('layerView', ['remove']);
        });
        var tileLayer = new TileLayer();

        this.map.layers.reset([tileLayer]);

        var tileLayerView = this.mapView.getLayerViewByLayerCid(tileLayer.cid);
        expect(tileLayerView).toBeDefined();

        this.map.layers.remove(tileLayer);

        // View for the tileLayer has been removed
        expect(tileLayerView.remove).toHaveBeenCalled();
        expect(this.mapView.getLayerViewByLayerCid(tileLayer.cid)).not.toBeDefined();
      });

      it('should should only remove a group layerView when all grouped layerModels have been removed', function () {
        this.layerViewFactory.createLayerView.and.callFake(function () {
          return jasmine.createSpyObj('layerView', ['remove']);
        });
        var cartoDBLayer1 = new CartoDBLayer();
        var cartoDBLayer2 = new CartoDBLayer();

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
    });
  });
});
