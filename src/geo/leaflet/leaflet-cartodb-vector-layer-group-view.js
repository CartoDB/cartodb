require('d3.cartodb');// TODO: The 'd3.cartodb' module doens't currently export L.CartoDBd3Layer
// and it's currently relying on window.L so weed to do the following trick.
// Check out: https://github.com/CartoDB/d3.cartodb/issues/93 for more info
var CartoDBd3Layer = window.L.CartoDBd3Layer;
var LeafletLayerView = require('./leaflet-layer-view');
var GeoJSONDataProviderFactory = require('../data-providers/geojson/geojson-data-provider-factory');

var LeafletCartoDBVectorLayerGroupView = CartoDBd3Layer.extend({
  includes: [
    LeafletLayerView.prototype
  ],

  // TODO: There's a conflict between LeafletLayerView.protoype.on
  // and L.CartoDBd3Layer.prototype.on. The GeoJSONDataProvider needs
  // to use the former one, so we have to add an alias.
  _on: CartoDBd3Layer.prototype.on,

  initialize: function (layerModel, leafletMap) {
    LeafletLayerView.call(this, layerModel, this, leafletMap);
    CartoDBd3Layer.prototype.initialize.call(this);

    // Bind changes to the urls of the model
    layerModel.bind('change:urls', this._onTileJSONChanged, this);

    layerModel.layers.bind('change:cartocss', function (child, style) {
      var index = child.get('order') - 1;
      this.setCartoCSS(index, style);
    }, this);

    layerModel.layers.bind('change:meta', function (child, meta) {
      var index = layerModel.layers.indexOf(child);
      this.options.styles[index] = meta.cartocss;
    }, this);

    layerModel.layers.each(function (layer) {
      this._onLayerAdded(layer, layerModel.layers);
    }, this);

    layerModel.layers.bind('add', this._onLayerAdded, this);

    this._on('featureClick', function (event, latlng, pos, data, layerIndex) {
      this.trigger('featureClick', event, latlng, pos, data, layerIndex);
    }.bind(this));

    this._on('featureOver', function (event, latlng, pos, data, layerIndex) {
      this.trigger('featureOver', event, latlng, pos, data, layerIndex);

      // CartoDB.js tooltips depend on the mouseover event so we trigger it here
      this.trigger('mouseover', event, latlng, pos, data);
    }.bind(this));

    this._on('featureOut', function (event, latlng, pos, data, layerIndex) {
      // CartoDB.js tooltips depend on the mouseout event so we trigger it here
      this.trigger('mouseout');
    }.bind(this));
  },

  _onLayerAdded: function (layerModel, layersCollection) {
    var layerIndex = layersCollection.indexOf(layerModel);
    layerModel.setDataProvider(new GeoJSONDataProviderFactory(this, layerIndex));
  },

  _onTileJSONChanged: function () {
    var tilejson = this.model.get('urls');
    this.options.styles = this.model.layers.pluck('cartocss');
    this.setUrl(tilejson.tiles[0]);
  },

  onAdd: function (map) {
    CartoDBd3Layer.prototype.onAdd.call(this, map);
    this.trigger('added', this);
    this.added = true;
  },

  // Invoked by LeafletLayerView
  _modelUpdated: function () {}
});

module.exports = LeafletCartoDBVectorLayerGroupView;
