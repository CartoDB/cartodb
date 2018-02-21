var _ = require('underscore');
var legendsMetadata = require('builder/data/legends/legends-metadata');

var legends;

var LEGENDS_METADATA = _.keys(legendsMetadata);
var LEGENDS_COLOR = ['category', 'choropleth'];

var LegendManager = {
  trackLegends: function (layers) {
    legends = {};

    _.each(layers.models, function (layerModel) {
      var legendsLayer;
      var options = {};
      if (layerModel.legends != null) {
        legendsLayer = layerModel.legends;
        _.each(LEGENDS_METADATA, function (legend) {
          var legendModel = legendsLayer[legend];
          if (legendModel.get('visible') === true) {
            options[legend] = legendModel;
          }
        });
        legends[layerModel.id] = options;
      }
    });
  },

  getLegends: function () {
    return legends;
  },

  updateLegends: function (layerId) {
    var legendsLayer = legends[layerId];
    _.each(LEGENDS_COLOR, function (legend) {
      var legendModel = legendsLayer[legend];
      legendModel && legendModel.set({visible: false});
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
