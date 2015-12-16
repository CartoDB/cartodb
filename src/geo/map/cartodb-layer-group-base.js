var $ = require('jquery');
var Backbone = require('backbone');
var MapLayer = require('./map-layer');
var Layers = require('./layers');
var util = require('cdb.core.util');

var CartoDBLayerGroupBase = MapLayer.extend({

  defaults: {
    visible: true
  },

  initialize: function(attributes, options) {
    MapLayer.prototype.initialize.apply(this, arguments);
    options = options || {};
    this.layers = new Backbone.Collection(options.layers || {});
  },

  isEqual: function() {
    return false;
  },

  getVisibleLayers: function() {
    return this.layers.filter(function(layer) {
      return layer.get('visible');
    });
  },

  getTileJSONFromTiles: function(layerIndex) {
    var urls = this.get('urls');
    if (!urls) {
      throw 'tileJSON for the layer cannot be calculated until urls are set';
    }

    return {
      tilejson: '2.0.0',
      scheme: 'xyz',
      grids: urls.grids[this._getIndexOfVisibleLayer(layerIndex)],
      tiles: urls.tiles,
      formatter: function(options, data) { return data; }
    };
  },

  _getIndexOfVisibleLayer: function(layerIndex) {
    throw "_getIndexOfVisibleLayer must be implemented";
  },

  fetchAttributes: function(layer, featureID, callback) {
    if (!this.get('baseURL')) {
      throw 'Attributes cannot be fetched until baseURL is set';
    }

    var index = this._getIndexOfVisibleLayer(layer);
    var url = [
      this.get('baseURL'),
      index,
      'attributes',
      featureID
    ].join('/');

    $.ajax({
      dataType: 'jsonp',
      url: url,
      jsonpCallback: '_cdbi_layer_attributes_' + util.uniqueCallbackName(this.toJSON()),
      cache: true,
      success: function(data) {
        // loadingTime.end();
        callback(data);
      },
      error: function(data) {
        // loadingTime.end();
        // cartodb.core.Profiler.metric('cartodb-js.named_map.attributes.error').inc();
        callback(null);
      }
    });
  }
});

module.exports = CartoDBLayerGroupBase;
