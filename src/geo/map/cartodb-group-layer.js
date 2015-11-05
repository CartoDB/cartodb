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
      return layer.get('visible')
    });
  },

  getTileJSONFromTiles: function(layerIndex) {
    if (!this.get('urls')) {
      throw 'URLS not fetched yet';
    }

    // TODO: Is this important?
    // var subdomains = ['0', '1', '2', '3'];

    // function replaceSubdomain(urls) {
    //   var urls = urls || [];
    //   var formattedURLs = [];
    //   for (var i = 0; i < urls.length; ++i) {
    //     formattedURLs.push(urls[i].replace('{s}', subdomains[i % subdomains.length]));
    //   }
    //   return formattedURLs;
    // }

    var urls = this.get('urls');

    return {
      tilejson: '2.0.0',
      scheme: 'xyz',
      grids: urls.grids[layerIndex],
      tiles: urls.tiles,
      formatter: function(options, data) { return data; }
    };
  },

  bindDashboardInstance: function(dashboardInstance) {
    this.dashboardInstance = dashboardInstance;
  },

  fetchAttributes: function(layer, featureID, callback) {
    this.dashboardInstance.fetchAttributes(layer, featureID, callback);
  }
});

module.exports = CartoDBGroupLayer;
