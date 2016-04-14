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
        if (!this._isAnalysisPartOfOtherAnalyses(sourceAnalysis)) {
          config.analyses.push(sourceAnalysis.toJSON());
        }
      }

      if (layerModel.isVisible()) {
        var layerConfig = {
          type: layerModel.get('type').toLowerCase(),
          options: {
            cartocss: layerModel.get('cartocss'),
            cartocss_version: layerModel.get('cartocss_version') || DEFAULT_CARTOCSS_VERSION,
            interactivity: layerModel.getInteractiveColumnNames()
          }
        };

        if (sourceId) {
          layerConfig.options.source = { id: sourceId };
        } else if (layerModel.get('sql')) { // Layer has some SQL that needs to be converted into a "source" analysis
          layerConfig.options.sql = layerModel.get('sql');
        }

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
  },

  _isAnalysisPartOfOtherAnalyses: function (analysisModel) {
    return this._analysisCollection.any(function (otherAnalysisModel) {
      if (analysisModel !== otherAnalysisModel) {
        return otherAnalysisModel.findAnalysisById(analysisModel.get('id'));
      }
      return false;
    });
  }
});

module.exports = AnonymousMap;
