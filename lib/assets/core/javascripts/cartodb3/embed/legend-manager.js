var _ = require('underscore');
var legendsMetadata = require('../data/legends/legends-metadata');

var legends;

var LEGENDS_METADATA = _.keys(legendsMetadata);
var LEGENDS_COLOR = ['category', 'choropleth'];

var LegendManager = {
  trackLegends: function (layers) {
    legends = {};

    _.each(layers.models, function (layer) {
      var legendsLayer;
      var o = {};
      if (layer.legends != null) {
        legendsLayer = layer.legends;
        _.each(LEGENDS_METADATA, function (legend) {
          var m = legendsLayer[legend];
          if (m.get('visible') === true) {
            o[legend] = m;
          }
        });
        legends[layer.id] = o;
      }
    });
  },

  getLegends: function () {
    return legends;
  },

  updateLegends: function (layerId) {
    var legendsLayer = legends[layerId];
    _.each(LEGENDS_COLOR, function (legend) {
      var m = legendsLayer[legend];
      m && m.set({visible: false});
    });
  },

  resetLegends: function (layerId) {
    var legendsLayer = legends[layerId];
    _.each(legendsLayer, function (legend) {
      legend.set({visible: true});
    });
  }
};

module.exports = LegendManager;
