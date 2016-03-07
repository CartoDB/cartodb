var _ = require('underscore');
var Backbone = require('backbone');
var CartoDBLayer = require('../../../../src/geo/map/cartodb-layer');
var GeoJSONDataProvider = require('../../../../src/geo/data-providers/geojson/geojson-data-provider-factory');
var LeafletCartoDBVectorLayerGroupView = require('../../../../src/geo/leaflet/leaflet-cartodb-vector-layer-group-view');
var L = window.L;

describe('src/geo/leaflet/leaflet-cartodb-vector-layer-group-view.js', function () {
  beforeEach(function () {
    this.leafletMap;
    this.layerGroupModel = new Backbone.Model({ type: 'wadus' });
    this.layerGroupModel.layers = new Backbone.Collection([]);
  });

  it('should register a new GeoJSONDataProvider on each CartoDBLayer on the layergroup', function () {
    var cartoDBLayer1 = new CartoDBLayer();
    var cartoDBLayer2 = new CartoDBLayer();
    this.layerGroupModel.layers = new Backbone.Collection([
      cartoDBLayer1, cartoDBLayer2
    ]);

    expect(cartoDBLayer1.getDataProvider()).toBeUndefined();
    expect(cartoDBLayer2.getDataProvider()).toBeUndefined();

    new LeafletCartoDBVectorLayerGroupView(this.layerGroupModel, this.leafletMap); // eslint-disable-line

    expect(cartoDBLayer1.getDataProvider() instanceof GeoJSONDataProvider).toBeTruthy();
    expect(cartoDBLayer2.getDataProvider() instanceof GeoJSONDataProvider).toBeTruthy();
  });

  it('should register a new GeoJSONDataProvider on new CartoDBLayers added to the layergroup after the layer view has been initialized', function () {
    new LeafletCartoDBVectorLayerGroupView(this.layerGroupModel, this.leafletMap); // eslint-disable-line

    var cartoDBLayer1 = new CartoDBLayer();
    var cartoDBLayer2 = new CartoDBLayer();

    expect(cartoDBLayer1.getDataProvider()).toBeUndefined();
    expect(cartoDBLayer2.getDataProvider()).toBeUndefined();

    this.layerGroupModel.layers.add(cartoDBLayer1);
    this.layerGroupModel.layers.add(cartoDBLayer2);

    expect(cartoDBLayer1.getDataProvider() instanceof GeoJSONDataProvider).toBeTruthy();
    expect(cartoDBLayer2.getDataProvider() instanceof GeoJSONDataProvider).toBeTruthy();
  });

  it('should translate internal L.CartoDBd3Layer events to Backbone events', function (done) {
    var cartoDBLayer1 = new CartoDBLayer();
    this.layerGroupModel.layers = new Backbone.Collection([
      cartoDBLayer1
    ]);

    var featureClickCallback = jasmine.createSpy('featureClickCallback');
    var featureOverCallback = jasmine.createSpy('featureOverCallback');
    var mouseoverCallback = jasmine.createSpy('mouseoverCallback');
    var mouseoutCallback = jasmine.createSpy('mouseoutCallback');

    var layerView = new LeafletCartoDBVectorLayerGroupView(this.layerGroupModel, this.leafletMap); // eslint-disable-line
    layerView.setUrl('http://wadus.com');

    _.defer(function () {
      layerView.bind('featureClick', featureClickCallback);
      layerView.bind('featureOver', featureOverCallback);
      layerView.bind('mouseover', mouseoverCallback);
      layerView.bind('mouseout', mouseoutCallback);

      layerView.eventCallbacks.featureClick('event', 'latlng', 'pos', 'data', 'layerIndex');
      layerView.eventCallbacks.featureOver('event', 'latlng', 'pos', 'data', 'layerIndex');
      layerView.eventCallbacks.featureOut('event');

      expect(featureClickCallback).toHaveBeenCalledWith('event', 'latlng', 'pos', 'data', 'layerIndex');
      expect(featureOverCallback).toHaveBeenCalledWith('event', 'latlng', 'pos', 'data', 'layerIndex');
      expect(mouseoverCallback).toHaveBeenCalledWith('event', 'latlng', 'pos', 'data');
      expect(mouseoutCallback).toHaveBeenCalled();

      done();
    });
  });
  it('should call setUrl when all named map styles have been added', function (done) {
    var cartoDBLayer1 = new CartoDBLayer();
    var cartoDBLayer2 = new CartoDBLayer();
    L.CartoDBd3Layer.prototype.setUrl = jasmine.createSpy();
    LeafletCartoDBVectorLayerGroupView.prototype._onTileJSONChanged = function () {
      this.options.styles = [undefined, undefined];
    };
    this.layerGroupModel.layers = new Backbone.Collection([
      cartoDBLayer1,
      cartoDBLayer2
    ]);
    var view = new LeafletCartoDBVectorLayerGroupView(this.layerGroupModel, this.leafletMap); // eslint-disable-line
    this.layerGroupModel.set('type', 'namedmap');
    this.layerGroupModel.set('urls', {tiles: []});
    cartoDBLayer1.set('meta', {cartocss: 'whatever'});
    _.defer(function () {
      expect(L.CartoDBd3Layer.prototype.setUrl).not.toHaveBeenCalled();
      cartoDBLayer2.set('meta', {cartocss: 'whatever2'});
      _.defer(function () {
        expect(L.CartoDBd3Layer.prototype.setUrl).toHaveBeenCalled();
        done();
      });
    });
  });
});
