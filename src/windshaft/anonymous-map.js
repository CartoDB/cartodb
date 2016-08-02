var _ = require('underscore');
var MapBase = require('./map-base');

var DEFAULT_CARTOCSS_VERSION = '2.1.0';

var AnonymousMap = MapBase.extend({
  toJSON: function () {
    return {
      layers: this._calculateLayersSection(),
      dataviews: this._calculateDataviewsSection(),
      analyses: this._calculateAnalysesSection()
    };
  },

  _calculateLayersSection: function () {
    return _.chain(this._getLayers())
      .map(this._calculateLayerJSON, this)
      .compact()
      .value();
  },

  _calculateLayerJSON: function (layerModel) {
    return {
      id: layerModel.get('id'),
      type: layerModel.get('type').toLowerCase(),
      options: this._calculateLayerOptions(layerModel)
    };
  },

  _calculateLayerOptions: function (layerModel) {
    // TODO: Only send "interactivity" and "attributes" options for "CartoDB" layers
    var options = {
      cartocss: layerModel.get('cartocss'),
      cartocss_version: layerModel.get('cartocss_version') || DEFAULT_CARTOCSS_VERSION,
      interactivity: layerModel.getInteractiveColumnNames()
    };

    var layerSourceId = layerModel.get('source');
    if (layerSourceId) {
      options.source = { id: layerSourceId };
    } else if (layerModel.get('sql')) { // Layer has some SQL that needs to be converted into a "source" analysis
      options.sql = layerModel.get('sql');
    }

    if (layerModel.get('sql_wrap')) {
      options.sql_wrap = layerModel.get('sql_wrap');
    }

    if (layerModel.infowindow && layerModel.infowindow.hasFields()) {
      options.attributes = {
        id: 'cartodb_id',
        columns: layerModel.infowindow.getFieldNames()
      };
    }

    return options;
  },

  _calculateDataviewsSection: function () {
    return this._dataviewsCollection.reduce(function (dataviews, dataviewModel) {
      dataviews[dataviewModel.get('id')] = dataviewModel.toJSON();
      return dataviews;
    }, {});
  },

  _calculateAnalysesSection: function () {
    var analyses = [];
    var sourceIdsFromLayers = _.chain(this._getLayers())
      .map(function (layerModel) {
        return layerModel.get('source');
      })
      .compact()
      .value();

    var sourceIdsFromDataviews = this._dataviewsCollection.chain()
      .map(function (dataviewModel) {
        return dataviewModel.getSourceId();
      })
      .compact()
      .value();

    var sourceIds = _.uniq(sourceIdsFromLayers.concat(sourceIdsFromDataviews));
    _.each(sourceIds, function (sourceId) {
      var sourceAnalysis = this._analysisCollection.findWhere({ id: sourceId });
      if (sourceAnalysis) {
        if (!this._isAnalysisPartOfOtherAnalyses(sourceAnalysis)) {
          analyses.push(sourceAnalysis.toJSON());
        }
      } else { // sourceId might be the ID of a layer
        var layerModel = this._getLayerById(sourceId);
        if (layerModel) {
          if (layerModel.get('sql')) {
            analyses.push(this._getSourceAnalysisForLayer(this._getLayerById(sourceId)));
          } else {
            // layerModel has a source, so the analysis will be included
            // in the payload when we get to that sourceId in this loop
          }
        } else {
          throw new Error("sourceId '" + sourceId + "' doesn't exist");
        }
      }
    }, this);

    return analyses;
  },

  _getLayerById: function (layerId) {
    return _.find(this._getLayers(), function (layerModel) {
      return layerModel.id === layerId;
    });
  },

  _getSourceAnalysisForLayer: function (layerModel) {
    return {
      id: layerModel.id,
      type: 'source',
      params: {
        query: layerModel.get('sql')
      }
    };
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
