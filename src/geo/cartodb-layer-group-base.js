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
      // TODO: We might need to get tiles of other type of layers too. For example, when we're generating
      // static images, we can't the layer with labels on top to be included.
      this.set({
        baseURL: mapInstance.getBaseURL(),
        urls: mapInstance.getTiles('mapnik')
      });
    }, this);
  },

  isEqual: function () {
    return false;
  },

  /**
   * Returns a TileJSON format object for the given layerIndex
   * @param  {number} layerIndex The index of one of the CartoDB layers grouped by this class.
   */
  getTileJSONFromTiles: function (layerIndex) {
    var urls = this.get('urls');
    if (urls) {
      return {
        tilejson: '2.0.0',
        scheme: 'xyz',
        grids: urls.grids[this._convertToMapnikLayerIndex(layerIndex)],
        tiles: urls.tiles,
        formatter: function (options, data) { return data; }
      };
    }
  },

  /**
   * Converts an index of a layer in relation to the layerGroup to
   * the corresponding index of that layer in the Windshaft Map Instance.
   */
  _convertToWindshaftLayerIndex: function (layerIndex) {
    throw new Error('_convertToWindshaftLayerIndex must be implemented');
  },

  /**
   * Converts the index of a 'CartoDB' layer in this layerGroup to
   * the corresponding index of that same layer in the Windshaft Map Instance,
   * only considering 'mapnik' layers (eg: ignoring possible `http` below the
   * `mapnik` layers ).
   */
  _convertToMapnikLayerIndex: function (layerIndex) {
    throw new Error('_convertToMapnikLayerIndex must be implemented');
  },

  fetchAttributes: function (layerIndex, featureID, callback) {
    if (!this.get('baseURL')) {
      throw new Error('Attributes cannot be fetched until baseURL is set');
    }

    var windhaftLayerIndex = this._convertToWindshaftLayerIndex(layerIndex);
    if (windhaftLayerIndex >= 0) {
      var url = this.get('baseURL') + '/' + windhaftLayerIndex + '/attributes/' + featureID;
      var apiKey = this._windshaftMap.get('apiKey');
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
