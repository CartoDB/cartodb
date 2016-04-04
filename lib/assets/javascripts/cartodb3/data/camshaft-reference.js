var camshaftReference = require('camshaft-reference').getVersion('latest');
var NODE_TYPE = 'node';
var SOURCE_ANALYSIS_TYPE = 'source';
var ANALYSIS_TYPE_TO_SOURCE_PARAM_NAMES_MAP = {};
ANALYSIS_TYPE_TO_SOURCE_PARAM_NAMES_MAP[SOURCE_ANALYSIS_TYPE] = [];
var ANALYSIS_TYPE_TO_PARAM_NAMES_MAP = {};

var analysesReference = camshaftReference.analyses;
if (!analysesReference) {
  throw new Error('Error loading the reference for Camshaft analyses');
}

// Populate the analysis source and param names maps.
for (var analysisType in analysesReference) {
  var analysisParams = analysesReference[analysisType].params;
  for (var paramName in analysisParams) {
    ANALYSIS_TYPE_TO_PARAM_NAMES_MAP[analysisType] = ANALYSIS_TYPE_TO_PARAM_NAMES_MAP[analysisType] || [];
    ANALYSIS_TYPE_TO_PARAM_NAMES_MAP[analysisType].push(paramName);

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
  },

  getParamNamesForAnalysisType: function (analysisType) {
    var paramNames = ANALYSIS_TYPE_TO_PARAM_NAMES_MAP[analysisType];
    if (!paramNames) {
      throw new Error('param names for analysis of type ' + analysisType + " couldn't be found");
    }

    return paramNames;
  }
};
