var _ = require('underscore');
var AnalysisService = require('../../../analysis/analysis-service');

/**
 * Return a payload with the serialization of all the analyses in the 
 * layersCollection and the dataviewsCollection.
 */
function serialize (layersCollection, dataviewsCollection) {
  var analysisList = AnalysisService.getAnalysisList(layersCollection, dataviewsCollection);
  return _generateUniqueAnalysisList(analysisList);
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
