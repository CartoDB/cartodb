var _ = require('underscore');
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


var DEFAULT_MISSING_PARAM_VALUES = [undefined, null, '', NaN];

var paramsForType = function (type) {
  var analysis = camshaftReference.analyses[type];
  if (!analysis) throw new Error('no analysis params found for type: ' + type);

  return analysis.params;
};

module.exports = {


  /**
   * Validate raw form attrs
   * @param {Object} formAttrs - e.g. {type: 'buffer', source: 'a0', radius: 'meh'}
   * @return {Object, undefined} returns an object with keys as faulty input, e.g. {radius: 'invalid-value'} for above
   */
  validate: function (formAttrs) {
    var errors = {};

    var parsedAttrs = this.parse(formAttrs);
    var params = paramsForType(formAttrs.type);

    for (var name in params) {
      var param = params[name];
      var val = parsedAttrs[name];

      if (!param.optional || val !== undefined) {
        switch (param.type) {
          case 'node':
            if (!val) {
              errors[name] = _t('data.analysis-definition-node-model.validation.invalid-source');
            }
            break;
          case 'number':
            if (isNaN(val)) {
              errors[name] = _t('data.analysis-definition-node-model.validation.invalid-value');
            }
            break;
          case 'enum':
            if (!_.contains(param.values, val)) {
              errors[name] = _t('data.analysis-definition-node-model.validation.invalid-enum', {expectedValues: JSON.stringify(param.values)});
            }
            break;
          default:
            if (val === null) {
              errors[name] = _t('data.analysis-definition-node-model.validation.missing-required');
            }
        }
      }
    }

    if (!_.isEmpty(errors)) {
      return errors;
    }
  },

  /**
   * Get type-parsed attrs from the raw form attrs
   * @param {Object} formAttrs - e.g. {type: 'buffer', source: 'a0 ', radius: '123', dissolved: 'false'}
   * @return {Object} e.g. {type: 'buffer', source: 'a0', radius: 123, dissolved: false}
   */
  parse: function (formAttrs) {
    var parsedAttrs = _.extend({}, formAttrs);
    var params = paramsForType(formAttrs.type);

    for (var name in params) {
      var param = params[name];
      var val = parsedAttrs[name];

      if (param.optional && _.contains(DEFAULT_MISSING_PARAM_VALUES, val)) {
        delete parsedAttrs[name];
      } else {
        switch (param.type) {
          case 'node':
            parsedAttrs[name] = (val || '').trim();
            break;
          case 'number':
            parsedAttrs[name] = parseFloat(val, 10);
            break;
          case 'boolean':
            parsedAttrs[name] = val === 'true' || val === true;
            break;
          default:
            if (_.contains(DEFAULT_MISSING_PARAM_VALUES, val)) {
              parsedAttrs[name] = null;
            } else if (_.isString(val)) {
              parsedAttrs[name] = val.trim();
            }
        }
      }
    }

    return parsedAttrs;
  },

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
