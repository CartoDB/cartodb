var _ = require('underscore');
var VisModel = require('../../../../src/vis/vis');
var LayersCollection = require('../../../../src/geo/map/layers');
var CartoDBLayer = require('../../../../src/geo/map/cartodb-layer');
var CartoDBLayerGroup = require('../../../../src/geo/cartodb-layer-group');
var GeoJSONDataProvider = require('../../../../src/geo/data-providers/geojson/data-provider');
var LeafletCartoDBVectorLayerGroupView = require('../../../../src/geo/leaflet/leaflet-cartodb-vector-layer-group-view');

describe('src/geo/leaflet/leaflet-cartodb-vector-layer-group-view.js', function () {
  beforeEach(function () {
    this.leafletMap;
    this.layersCollection = new LayersCollection();
    this.layerGroupModel = new CartoDBLayerGroup({}, {
      layersCollection: this.layersCollection
    });
    this.layerGroupModel.getTileURLTemplates = function () { return [ 'http://carto.com/{z}/{x}/{y}.png' ]; };

    this.vis = new VisModel();
  });

  it('should register a new GeoJSONDataProvider on each CartoDBLayer on the layergroup', function () {
    var cartoDBLayer1 = new CartoDBLayer({ id: 'layer1' }, { vis: this.vis });
    var cartoDBLayer2 = new CartoDBLayer({ id: 'layer2' }, { vis: this.vis });
    this.layersCollection.reset([ cartoDBLayer1, cartoDBLayer2 ]);

    expect(cartoDBLayer1.getDataProvider()).toBeUndefined();
    expect(cartoDBLayer2.getDataProvider()).toBeUndefined();

    new LeafletCartoDBVectorLayerGroupView(this.layerGroupModel, this.leafletMap); // eslint-disable-line

    expect(cartoDBLayer1.getDataProvider() instanceof GeoJSONDataProvider).toBeTruthy();
    expect(cartoDBLayer2.getDataProvider() instanceof GeoJSONDataProvider).toBeTruthy();
  });

  it('should register a new GeoJSONDataProvider on new CartoDBLayers added to the layergroup after the layer view has been initialized', function () {
    new LeafletCartoDBVectorLayerGroupView(this.layerGroupModel, this.leafletMap); // eslint-disable-line

    var cartoDBLayer1 = new CartoDBLayer({ id: 'layer1' }, { vis: this.vis });
    var cartoDBLayer2 = new CartoDBLayer({ id: 'layer2' }, { vis: this.vis });

    expect(cartoDBLayer1.getDataProvider()).toBeUndefined();
    expect(cartoDBLayer2.getDataProvider()).toBeUndefined();

    this.layersCollection.add(cartoDBLayer1);
    this.layersCollection.add(cartoDBLayer2);

    expect(cartoDBLayer1.getDataProvider() instanceof GeoJSONDataProvider).toBeTruthy();
    expect(cartoDBLayer2.getDataProvider() instanceof GeoJSONDataProvider).toBeTruthy();
  });

  it('should translate internal L.CartoDBd3Layer events to Backbone events', function (done) {
    var cartoDBLayer1 = new CartoDBLayer({ id: 'layer1' }, { vis: this.vis });
    this.layersCollection.add(cartoDBLayer1);

    var featureClickCallback = jasmine.createSpy('featureClickCallback');
    var featureOverCallback = jasmine.createSpy('featureOverCallback');
    var featureOutCallback = jasmine.createSpy('featureOutCallback');

    var layerView = new LeafletCartoDBVectorLayerGroupView(this.layerGroupModel, this.leafletMap); // eslint-disable-line
    layerView.setUrl('http://wadus.com');

    _.defer(function () {
      layerView.bind('featureClick', featureClickCallback);
      layerView.bind('featureOver', featureOverCallback);
      layerView.bind('featureOut', featureOutCallback);

      layerView.eventCallbacks.featureClick('event', 'latlng', 'pos', 'data', 0);
      expect(featureClickCallback.calls.argsFor(0)[0]).toEqual({
        layer: cartoDBLayer1,
        layerIndex: 0,
        latlng: 'latlng',
        position: 'pos',
        feature: 'data'
      });

      layerView.eventCallbacks.featureOver('event', 'latlng', 'pos', 'data', 0);
      expect(featureOverCallback.calls.argsFor(0)[0]).toEqual({
        layer: cartoDBLayer1,
        layerIndex: 0,
        latlng: 'latlng',
        position: 'pos',
        feature: 'data'
      });

      layerView.eventCallbacks.featureOut('event', 'latlng', 'pos', 'data', 0);
      expect(featureOutCallback.calls.argsFor(0)[0]).toEqual({
        layer: cartoDBLayer1,
        layerIndex: 0
      });
      done();
    });
  });

  it('should set the styles options when meta changes', function () {
    var cartoDBLayer1 = new CartoDBLayer({ id: 'layer1' }, { vis: this.vis });
    var cartoDBLayer2 = new CartoDBLayer({ id: 'layer2' }, { vis: this.vis });
    this.layersCollection.reset([ cartoDBLayer1, cartoDBLayer2 ]);

    var view = new LeafletCartoDBVectorLayerGroupView(this.layerGroupModel, this.leafletMap); // eslint-disable-line

    expect(view.options.styles).toEqual([ undefined ]);

    cartoDBLayer1.set('meta', {cartocss: 'whatever'});
    cartoDBLayer2.set('meta', {cartocss: 'whatever2'});
    expect(view.options.styles).toEqual([ 'whatever', 'whatever2' ]);
  });

  it('should set a new tile template URL when urls change', function () {
    var view = new LeafletCartoDBVectorLayerGroupView(this.layerGroupModel, this.leafletMap); // eslint-disable-line

    spyOn(view, 'setUrl');

    this.layerGroupModel.getTileURLTemplates = function () {
      return [
        'http://0.ashbu.cartocdn.com/documentation/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/0/{z}/{x}/{y}.png',
        'http://1.ashbu.cartocdn.com/documentation/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/0/{z}/{x}/{y}.png',
        'http://2.ashbu.cartocdn.com/documentation/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/0/{z}/{x}/{y}.png',
        'http://3.ashbu.cartocdn.com/documentation/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/0/{z}/{x}/{y}.png'
      ];
    };

    this.layerGroupModel.set('urls', { tiles: [ ] });

    expect(view.setUrl).toHaveBeenCalledWith('http://0.ashbu.cartocdn.com/documentation/api/v1/map/90e64f1b9145961af7ba36d71b887dd2:0/0/{z}/{x}/{y}.png');
  });
});
