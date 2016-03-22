var _ = require('underscore');
var LayerGroupConfig = {};

var DEFAULT_CARTOCSS_VERSION = '2.1.0';

LayerGroupConfig.generate = function (options) {
  var layers = options.layers;
  var dataviewsCollection = options.dataviews;
  var config = {
    layers: [],
    dataviews: {},
    analyses: []
  };

  _.each(layers, function (layer) {
    var sourceId;
    var sourceAnalysis = layer.get('source');
    if (sourceAnalysis) {
      sourceId = sourceAnalysis.get('id');
    } else if (layer.get('sql')) { // Layer has some SQL that needs to be converted into a "source" analysis
      sourceId = layer.get('id');
      sourceAnalysis = {
        id: sourceId,
        type: 'source',
        params: {
          query: layer.get('sql')
        }
      };
    }

    var sourceAnalysisIsPartOfOtherAnalysis = _.any(layers, function (otherLayer) {
      return layer !== otherLayer && otherLayer.get('source') && otherLayer.get('source').findAnalysisById(sourceId);
    });

    if (!sourceAnalysisIsPartOfOtherAnalysis) {
      var analysisJSON = sourceAnalysis.toJSON ? sourceAnalysis.toJSON() : sourceAnalysis;
      config.analyses.push(analysisJSON);
    }

    if (layer.isVisible()) {
      var layerConfig = {
        type: layer.get('type').toLowerCase(),
        options: {
          source: { id: sourceId },
          cartocss: layer.get('cartocss'),
          cartocss_version: layer.get('cartocss_version') || DEFAULT_CARTOCSS_VERSION,
          interactivity: layer.getInteractiveColumnNames()
        }
      };

      if (layer.getInfowindowFieldNames().length) {
        layerConfig.options.attributes = {
          id: 'cartodb_id',
          columns: layer.getInfowindowFieldNames()
        };
      }

      config.layers.push(layerConfig);
    }
  });

  dataviewsCollection.each(function (dataviewModel) {
    config.dataviews[dataviewModel.get('id')] = dataviewModel.toJSON();
  });

  return config;
};

module.exports = LayerGroupConfig;
