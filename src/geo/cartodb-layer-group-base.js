var $ = require('jquery');
var Backbone = require('backbone');
var util = require('cdb.core.util');

var CartoDBLayerGroupBase = Backbone.Model.extend({
  defaults: {
    visible: true
  },

  initialize: function (attributes, options) {
    options = options || {};

    if (!options.windshaftMap) {
      throw new Error('windshaftMap option is required');
    }

    this.layers = new Backbone.Collection(options.layers || []);
    this._windshaftMap = options.windshaftMap;

    // When a new instance of the map is created in Windshaft, we will need to use
    // new URLs for the tiles (`urls` attribute) and also for the attributes (`baseURL`)
    this._windshaftMap.bind('instanceCreated', function (mapInstance) {
      this.set({
        baseURL: mapInstance.getBaseURL(),
        urls: mapInstance.getTiles('mapnik')
      });
    }, this);
  },

  isEqual: function () {
    return false;
  },

  getTileJSONFromTiles: function (layerIndex) {
    var urls = this.get('urls');
    if (!urls) {
      throw new Error('tileJSON for the layer cannot be calculated until urls are set');
    }

    return {
      tilejson: '2.0.0',
      scheme: 'xyz',
      grids: urls.grids[this._getIndexOfVisibleLayer(layerIndex)],
      tiles: urls.tiles,
      formatter: function (options, data) { return data; }
    };
  },

  _getIndexOfVisibleLayer: function (layerIndex) {
    throw new Error('_getIndexOfVisibleLayer must be implemented');
  },

  fetchAttributes: function (layer, featureID, callback) {
    if (!this.get('baseURL')) {
      throw new Error('Attributes cannot be fetched until baseURL is set');
    }

    // TODO: We need to improve this
    var index = this._getIndexOfVisibleLayer(layer);
    if (index >= 0) {
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
