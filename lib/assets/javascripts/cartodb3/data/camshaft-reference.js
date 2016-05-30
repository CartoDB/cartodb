var _ = require('underscore');
var camshaftReference = require('camshaft-reference').getVersion('latest');

var SOURCE_NAMES_MAP = {}; // string -> array, e.g. {'point-in-polygon': ['points_source', 'polygons_source']}
var DEFAULT_MISSING_PARAM_VALUES = [undefined, null, '', NaN];

module.exports = {

  paramsForType: function (type) {
    var analysis = camshaftReference.analyses[type];
    if (!analysis) throw new Error('no analysis params found for type: ' + type);

    return _.clone(analysis.params);
  },

  /**
   * Validate raw form attrs
   * @param {Object} formAttrs - e.g. {type: 'buffer', source: 'a0', radius: 'meh'}
   * @return {Object, undefined} returns an object with keys as faulty input, e.g. {radius: 'invalid-value'} for above
   */
  validate: function (formAttrs) {
    var errors = {};

    var parsedAttrs = this.parse(formAttrs);
    var params = this.paramsForType(formAttrs.type);

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
    var params = this.paramsForType(formAttrs.type);

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

  getSourceNamesForAnalysisType: function (type) {
    if (!SOURCE_NAMES_MAP[type]) {
      var sourceNames = [];
      var params = this.paramsForType(type);

      for (var name in params) {
        var param = params[name];
        if (param.type === 'node') {
          sourceNames.push(name);
        }
      }

      SOURCE_NAMES_MAP[type] = sourceNames;
    }

    return SOURCE_NAMES_MAP[type];
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
