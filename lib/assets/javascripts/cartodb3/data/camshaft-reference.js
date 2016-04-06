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
  },

  getDefaultCartoCSSForType: function (type) {
    return [
      "#points['mapnik::geometry_type'=1] {",
      '  marker-fill-opacity: 1;',
      '  marker-line-color: #FFF;',
      '  marker-line-width: 0.5;',
      '  marker-line-opacity: 1;',
      '  marker-placement: point;',
      '  marker-type: ellipse;',
      '  marker-width: 8;',
      '  marker-fill: #FABADA;',
      '  marker-allow-overlap: true;',
      '}',
      "#lines['mapnik::geometry_type'=2] {",
      '  line-color: #000000;',
      '  line-width: 2;',
      '  line-opacity: 1;',
      '}',
      "#polygons['mapnik::geometry_type'=3] {",
      '  polygon-fill: #FABADA;',
      '  polygon-opacity: 1;',
      '  line-color: #FFF;',
      '  line-width: 0.5;',
      '  line-opacity: 1;',
      '}'
    ].join('\n');
  },

  getOutputGeometryForType: function (nodeDefinition) {
    var outputGeometry = '';

    switch (nodeDefinition.type) {
      case 'buffer':
        outputGeometry = 'polygon';
        break;
      case 'trade-area':
        outputGeometry = 'polygon';
        break;
      case 'point-in-polygon':
        // TODO but it's still the camshaft reference should yield output geometry based on definition params,
        //      this param is still missing though so for now always yields point
        outputGeometry = 'point';
        break;
    }

    return outputGeometry;
  },

  getValidInputGeometriesForType: function (type, sourceParamName) {
    var inputGeometries = [];

    switch (type) {
      case 'buffer':
        inputGeometries = ['point', 'polygon'];
        break;
      case 'trade-area':
        inputGeometries = ['point', 'polygon'];
        break;
      case 'point-in-polygon':
        inputGeometries = ['point', 'polygon'];
        break;
    }

    return inputGeometries;
  }
};
