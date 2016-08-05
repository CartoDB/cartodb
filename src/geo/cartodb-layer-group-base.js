var $ = require('jquery');
var Backbone = require('backbone');
var util = require('../core/util');

var CartoDBLayerGroupBase = Backbone.Model.extend({
  defaults: {
    visible: true
  },

  initialize: function (attributes, options) {
    options = options || {};

    if (!options.layersCollection) {
      throw new Error('layersCollection option is required');
    }
    this._layersCollection = options.layersCollection;
  },

  getLayers: function () {
    return this._layersCollection.getCartoDBLayers();
  },

  getIndexOf: function (layerModel) {
    return this.getLayers().indexOf(layerModel);
  },

  getLayerAt: function (index) {
    return this.getLayers()[index];
  },

  isEqual: function () {
    return false;
  },

  hasURLs: function () {
    return !!this.get('urls');
  },

  getTileURLTemplates: function () {
    return (this.get('urls') && this.get('urls').tiles) || [];
  },

  hasTileURLTemplates: function () {
    return this.getTileURLTemplates().length > 0;
  },

  getGridURLTemplates: function (layerIndex) {
    return (this.get('urls') && this.get('urls').grids && this.get('urls').grids[layerIndex]) || [];
  },

  /**
   * Converts an index of a layer in relation to the layerGroup to
   * the corresponding index of that layer in the Windshaft Map Instance.
   */
  _convertToWindshaftLayerIndex: function (layerIndex) {
    throw new Error('_convertToWindshaftLayerIndex must be implemented');
  },

  fetchAttributes: function (layerIndex, featureID, callback) {
    if (!this.get('baseURL')) {
      throw new Error('Attributes cannot be fetched until baseURL is set');
    }

    var windhaftLayerIndex = this._convertToWindshaftLayerIndex(layerIndex);
    if (windhaftLayerIndex >= 0) {
      var url = this.get('baseURL') + '/' + windhaftLayerIndex + '/attributes/' + featureID;
      var apiKey = this.get('apiKey');
      if (apiKey) {
        url += '?api_key=' + apiKey;
      }

      $.ajax({
        dataType: 'jsonp',
        url: url,
        jsonpCallback: '_cdbi_layer_attributes_' + util.uniqueCallbackName(this.toJSON()),
        cache: true,
        success: function (data) {
          // loadingTime.end();
          callback(data);
        },
        error: function (data) {
          // loadingTime.end();
          // cartodb.core.Profiler.metric('cartodb-js.named_map.attributes.error').inc();
          callback(null);
        }
      });
    } else {
      callback(null);
    }
  }
});

module.exports = CartoDBLayerGroupBase;
