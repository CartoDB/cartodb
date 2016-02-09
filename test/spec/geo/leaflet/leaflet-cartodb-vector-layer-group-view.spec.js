var Backbone = require('backbone');
var CartoDBLayer = require('../../../../src/geo/map/cartodb-layer');
var GeoJSONDataProvider = require('../../../../src/geo/data-providers/geojson/geojson-data-provider');
var LeafletCartoDBVectorLayerGroupView = require('../../../../src/geo/leaflet/leaflet-cartodb-vector-layer-group-view');
describe('src/geo/leaflet/leaflet-cartodb-vector-layer-group-view.js', function () {
  beforeEach(function () {
    this.leafletMap;
    this.layerGroupModel = new Backbone.Model({ type: 'wadus' });
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
    this.layerGroupModel.layers = new Backbone.Collection([]);

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
});
