var L = require('leaflet');
var _ = require('underscore');
require('d3.cartodb');
var LeafletLayerView = require('./leaflet-layer-view');
var GeoJSONDataProvider = require('../data-providers/geojson/geojson-data-provider');

var LeafletCartoDBVectorLayerGroupView = L.CartoDBd3Layer.extend({
  includes: [
    LeafletLayerView.prototype
  ],

  initialize: function (layerModel, leafletMap) {
    LeafletLayerView.call(this, layerModel, this, leafletMap);
    L.CartoDBd3Layer.prototype.initialize.call(this);

    // Bind changes to the urls of the model
    layerModel.bind('change:urls', this._onTileJSONChanged, this);

    layerModel.layers.bind('change:cartocss', function (child, style) {
      var index = child.get('order') - 1;
      this.setCartoCSS(index, style);
    }, this);

    layerModel.layers.each(function (layer) {
      this._onLayerAdded(layer, layerModel.layers);
    }, this);

    layerModel.layers.bind('add', this._onLayerAdded, this);
  },

  _onLayerAdded: function (layerModel, layersCollection) {
    var layerIndex = layersCollection.indexOf(layerModel);

    layerModel.setDataProvider(new GeoJSONDataProvider(this, layerIndex));
  },

  _onTileJSONChanged: function () {
    var tilejson = this.model.get('urls');
    this.options.styles = this.model.layers.pluck('cartocss');
    this.setUrl(tilejson.tiles[0]);
  },

  onAdd: function (map) {
    L.CartoDBd3Layer.prototype.onAdd.call(this, map);
    this.trigger('added', this);
    this.added = true;
  },

  // Invoked by LeafletLayerView
  _modelUpdated: function () {}
});

// TODO: Remove these once L.CartoDBd3Layer implements them
_.extend(LeafletCartoDBVectorLayerGroupView.prototype, {
  featuresLoaded: function () {
    return false;
  },
  getFeatures: function () {
    return [];
  }
});

module.exports = LeafletCartoDBVectorLayerGroupView;
