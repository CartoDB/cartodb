var _ = require('underscore');
var LayerTypes = require('../../../geo/map/layer-types.js');

/**
 * Return a payload with the serialization of all the analyses in the 
 * layersCollection and the dataviewsCollection.
 */
function serialize (layersCollection, dataviewsCollection) {
  var analyses = [];
  var layerAnalyses = _getAnalysesFromLayers(layersCollection);
  var dataviewsAnalyses = _getAnalysesFromDataviews(dataviewsCollection);

  var ids = {};
  var analysesList = layerAnalyses.concat(dataviewsAnalyses);
  _.forEach(analysesList, function (analysis) {
    if (!ids[analysis.get('id')] && !_isAnalysisPartOfOtherAnalyses(analysis, analysesList)) {
      ids[analysis.get('id')] = true; // keep a set of already added analysis.
      analyses.push(analysis.toJSON());
    }
  });
  return analyses;
}

/**
 * Return the analyses contained in a layers collection.
 */
function _getAnalysesFromLayers (layersCollection) {
  var layers = _getCartoDBAndTorqueLayers(layersCollection);
  return layers.map(function (layer) { return layer.getSource(); });
}

/**
 * Return the analyses contained in a dataviews collection
 */
function _getAnalysesFromDataviews (dataviewsCollection) {
  // TODO: To be implemented
  return [];
}

/**
 * Filter a layersCollection returning only cartodb and torque layers
 */
function _getCartoDBAndTorqueLayers (layersCollection) {
  return layersCollection.filter(function (layer) {
    return LayerTypes.isCartoDBLayer(layer) || LayerTypes.isTorqueLayer(layer);
  });
}

/**
 * 
 */
function _isAnalysisPartOfOtherAnalyses (analysis, analysisCollection) {
  return _.any(analysisCollection, function (otherAnalysisModel) {
    if (!analysis.equals(otherAnalysisModel)) {
      return otherAnalysisModel.findAnalysisById(analysis.get('id'));
    }
    return false;
  });
}

module.exports = {
  serialize: serialize
};
