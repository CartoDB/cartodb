var Backbone = require('backbone');
var MapLayer = require('./map-layer');
var Layers = require('./layers');

var CartoDBGroupLayer = MapLayer.extend({

  defaults: {
    visible: true,
    type: 'layergroup'
  },

  initialize: function(attributes, options) {
    this.layers = new Backbone.Collection(options.layers);
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
    if (!this.get('urls')) {
      throw 'URLS not fetched yet';
    }

    // Layergroup
    var urls = this.get('urls');


    var index = this._getIndexOfVisibleLayer(layerIndex);

    // TODO: layerIndex should take into account the hidden layers.
    // For example, for a layergroup, if the layerIndex is 1 but layer 0 is hidden, this method should
    // use urls.grids[0]
    return {
      tilejson: '2.0.0',
      scheme: 'xyz',
      grids: urls.grids[index],
      tiles: urls.tiles,
      formatter: function(options, data) { return data; }
    };
  },

  _getIndexOfVisibleLayer: function(layerIndex) {
    if (this.get('namedMap') === true) {
      return layerIndex;
    } else {
      var layers = {};
      var i = 0;
      this.layers.each(function(layer, index) {
        if(layer.isVisible()) {
          layers[index] = i;
          i++;
        }
      });
      var index = layers[layerIndex];
      if (index === undefined) {
        index = -1;
      }

      return index;
    }
  },

  bindDashboardInstance: function(dashboardInstance) {
    this.dashboardInstance = dashboardInstance;
  },

  fetchAttributes: function(layer, featureID, callback) {
    var index = this._getIndexOfVisibleLayer(layer);
    this.dashboardInstance.fetchAttributes(index, featureID, callback);
  }
});

module.exports = CartoDBGroupLayer;
