var _ = require('underscore');
var MapBase = require('./map-base');

var DEFAULT_CARTOCSS_VERSION = '2.1.0';

var AnonymousMap = MapBase.extend({
  toJSON: function () {
    var config = {
      layers: [],
      dataviews: {},
      analyses: []
    };

    _.each(this._getLayers(), function (layerModel) {
      var sourceAnalysis;
      var sourceId = layerModel.get('source');
      if (sourceId) {
        sourceAnalysis = this._analysisCollection.findWhere({ id: sourceId });
      } else if (layerModel.get('sql')) { // Layer has some SQL that needs to be converted into a "source" analysis
        sourceId = layerModel.get('id');
        sourceAnalysis = {
          id: sourceId,
          type: 'source',
          params: {
            query: layerModel.get('sql')
          }
        };
      } else {
        throw new Error('sourceAnalysis does\'t exist');
      }

      var sourceAnalysisIsPartOfOtherAnalysis = this._layersCollection.any(function (otherLayerModel) {
        if (layerModel !== otherLayerModel && otherLayerModel.get('source')) {
          var othersLayerSourceId = otherLayerModel.get('source');
          var otherLayersSource = this._analysisCollection.findWhere({ id: othersLayerSourceId });
          return otherLayersSource.findAnalysisById(sourceId);
        }
        return false;
      }, this);

      if (!sourceAnalysisIsPartOfOtherAnalysis) {
        var analysisJSON = sourceAnalysis.toJSON ? sourceAnalysis.toJSON() : sourceAnalysis;
        config.analyses.push(analysisJSON);
      }

      if (layerModel.isVisible()) {
        var layerConfig = {
          type: layerModel.get('type').toLowerCase(),
          options: {
            source: { id: sourceId },
            cartocss: layerModel.get('cartocss'),
            cartocss_version: layerModel.get('cartocss_version') || DEFAULT_CARTOCSS_VERSION,
            interactivity: layerModel.getInteractiveColumnNames()
          }
        };

        if (layerModel.getInfowindowFieldNames().length) {
          layerConfig.options.attributes = {
            id: 'cartodb_id',
            columns: layerModel.getInfowindowFieldNames()
          };
        }

        config.layers.push(layerConfig);
      }
    }, this);

    this._dataviewsCollection.each(function (dataviewModel) {
      config.dataviews[dataviewModel.get('id')] = dataviewModel.toJSON();
    });

    return config;
  }
});

module.exports = AnonymousMap;
