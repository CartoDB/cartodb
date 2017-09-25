var _ = require('underscore');
var LayerTypes = require('../../../geo/map/layer-types.js');

function serialize (analysisCollection, dataviewsCollection) {
  return _calculateAnalysesSection(analysisCollection, dataviewsCollection);
}

function _calculateAnalysesSection (analysisCollection, dataviewsCollection) {
  var analyses = [];
  var sourceIdsFromLayers = _.chain(_getCartoDBAndTorqueLayers())
    .map(function (layerModel) {
      return layerModel.getSourceId();
    })
    .compact()
    .value();

  var sourceIdsFromDataviews = dataviewsCollection.chain()
    .map(function (dataviewModel) {
      return dataviewModel.getSourceId();
    })
    .compact()
    .value();

  var sourceIds = _.uniq(sourceIdsFromLayers.concat(sourceIdsFromDataviews));
  _.each(sourceIds, function (sourceId) {
    var sourceAnalysis = analysisCollection.findWhere({ id: sourceId });
    if (sourceAnalysis) {
      if (!_isAnalysisPartOfOtherAnalyses(sourceAnalysis)) {
        analyses.push(sourceAnalysis.toJSON());
      }
    } else {
      throw new Error("sourceId '" + sourceId + "' doesn't exist");
    }
  }, this);

  return analyses;
}

function _getCartoDBAndTorqueLayers (layersCollection) {
  return layersCollection.select(function (layer) {
    return LayerTypes.isCartoDBLayer(layer) || LayerTypes.isTorqueLayer(layer);
  });
}

function _isAnalysisPartOfOtherAnalyses (analysisModel) {
  return this._analysisCollection.any(function (otherAnalysisModel) {
    if (analysisModel !== otherAnalysisModel) {
      return otherAnalysisModel.findAnalysisById(analysisModel.get('id'));
    }
    return false;
  });
}

module.exports = {
  serialize: serialize
};
