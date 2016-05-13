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
      var layerSourceId = layerModel.get('source');
      if (layerSourceId) {
        var sourceAnalysis = this._analysisCollection.findWhere({ id: layerSourceId });
        if (!this._isAnalysisPartOfOtherAnalyses(sourceAnalysis)) {
          config.analyses.push(sourceAnalysis.toJSON());
        }
      } else {
        if (this._isAnyDataviewLinkedTo(layerModel)) {
          layerSourceId = layerModel.get('id');
          config.analyses.push({
            id: layerSourceId,
            type: 'source',
            params: {
              query: layerModel.get('sql')
            }
          });
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

        if (layerSourceId) {
          layerConfig.options.source = { id: layerSourceId };
        } else if (layerModel.get('sql')) { // Layer has some SQL that needs to be converted into a "source" analysis
          layerConfig.options.sql = layerModel.get('sql');
        }

        if (layerModel.get('sql_wrap')) {
          layerConfig.options.sql_wrap = layerModel.get('sql_wrap');
        }

        if (layerModel.infowindow && layerModel.infowindow.hasFields()) {
          layerConfig.options.attributes = {
            id: 'cartodb_id',
            columns: layerModel.infowindow.getFieldNames()
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
  },

  _isAnyDataviewLinkedTo: function (layerModel) {
    return this._dataviewsCollection.any(function (dataviewModel) {
      return dataviewModel.layer === layerModel;
    });
  }
});

module.exports = AnonymousMap;
