var camshaftReference = require('camshaft-reference').getVersion('latest');
var NODE_TYPE = 'node';
var SOURCE_ANALYSIS_TYPE = 'source';
var ANALYSIS_TYPE_TO_SOURCE_PARAM_NAMES_MAP = {};
ANALYSIS_TYPE_TO_SOURCE_PARAM_NAMES_MAP[SOURCE_ANALYSIS_TYPE] = [];

var analysesReference = camshaftReference.analyses;
if (!analysesReference) {
  throw new Error('Error loading the reference for Camshaft analyses');
}

// Populate the Map of analyses
for (var analysisType in analysesReference) {
  var analysisParams = analysesReference[analysisType].params;
  for (var paramName in analysisParams) {
    if (analysisParams[paramName].type === NODE_TYPE) {
      ANALYSIS_TYPE_TO_SOURCE_PARAM_NAMES_MAP[analysisType] = ANALYSIS_TYPE_TO_SOURCE_PARAM_NAMES_MAP[analysisType] || [];
      ANALYSIS_TYPE_TO_SOURCE_PARAM_NAMES_MAP[analysisType].push(paramName);
    }
  }
}

module.exports = {
  getSourceNamesForAnalysisType: function (analysisType) {
    var sourceNames = ANALYSIS_TYPE_TO_SOURCE_PARAM_NAMES_MAP[analysisType];
    if (!sourceNames) {
      throw new Error('source names for analysis of type ' + analysisType + " couldn't be found");
    }

    return sourceNames;
  }
};
