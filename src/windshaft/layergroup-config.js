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
    // Layer has some SQL that needs to be converted into a "source" analysis
    var sourceId;
    var sourceAnalysis;
    if (layer.get('source')) {
      sourceAnalysis = layer.get('source');
      sourceId = sourceAnalysis.get('id');
    } else if (layer.get('sql')) {
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
          // sql: layer.get('sql'),
          source: { id: sourceId },
          cartocss: layer.get('cartocss'),
          cartocss_version: layer.get('cartocss_version') || DEFAULT_CARTOCSS_VERSION,
          interactivity: layer.getInteractiveColumnNames()
          // TODO widgets should be renamed to dataviews, requires Windshaft to be changed first though
          // widgets: {}
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
