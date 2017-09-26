var _ = require('underscore');
var LayerTypes = require('../../../geo/map/layer-types.js');

/**
 * Return a payload with the serialization of all the analyses in the 
 * layersCollection and the dataviewsCollection.
 */
function serialize (layersCollection, dataviewsCollection) {
  var layerAnalyses = _getAnalysesFromLayers(layersCollection);
  var dataviewsAnalyses = _getAnalysesFromDataviews(dataviewsCollection);
  return _generateUniqueAnalysisList(layerAnalyses.concat(dataviewsAnalyses));
}

/**
 * Return an analysis list without duplicated or nested analyses
 */
function _generateUniqueAnalysisList (analysesList) {
  var analysesIds = {};
  return _.reduce(analysesList, function (list, analysis) {
    if (!analysesIds[analysis.get('id')] && !_isAnalysisPartOfOtherAnalyses(analysis, analysesList)) {
      analysesIds[analysis.get('id')] = true; // keep a set of already added analysis.
      list.push(analysis.toJSON());
    }
    return list;
  }, []);
}

function _getAnalysesFromLayers (layersCollection) {
  var layers = _getCartoDBAndTorqueLayers(layersCollection);
  return layers.map(function (layer) {
    return layer.getSource();
  });
}

function _getAnalysesFromDataviews (dataviewsCollection) {
  return dataviewsCollection.map(function (dataview) {
    return dataview.getSource();
  });
}

function _getCartoDBAndTorqueLayers (layersCollection) {
  return layersCollection.filter(function (layer) {
    return LayerTypes.isCartoDBLayer(layer) || LayerTypes.isTorqueLayer(layer);
  });
}

/**
 * Check if an analysis is referenced by other anylisis in the given
 * analysis collection.
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
