var _ = require('underscore');
var camshaftReference = require('camshaft-reference').getVersion('latest');
var DefaultCartography = require('./default-cartography.json');

var SOURCE_NAMES_MAP = {}; // string -> array, e.g. {'intersection': ['source', 'target']}
var DEFAULT_MISSING_PARAM_VALUES = [undefined, null, '', NaN];

module.exports = {
  hasType: function (type) {
    return !!camshaftReference.analyses[type];
  },

  paramsForType: function (type) {
    if (!this.hasType(type)) throw new Error('no analysis params found for type: ' + type);

    return _.clone(camshaftReference.analyses[type].params);
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

  getDefaultCartoCSSForType: function () {
    return _.template([
      "#layer['mapnik::geometry_type'=1] {",
      '  marker-width: <%= point.fill.size.fixed %>;',
      '  marker-fill: <%= point.fill.color.fixed %>;',
      '  marker-fill-opacity: <%= point.fill.color.opacity %>;',
      '  marker-line-color: <%= point.stroke.color.fixed %>;',
      '  marker-line-width: <%= point.stroke.size.fixed %>;',
      '  marker-line-opacity: <%= point.stroke.color.opacity %>;',
      '  marker-type: ellipse;',
      '  marker-allow-overlap: true;',
      '}',
      "#layer['mapnik::geometry_type'=2] {",
      '  line-color: <%= line.stroke.color.fixed %>;',
      '  line-width: <%= line.stroke.size.fixed %>;',
      '  line-opacity: 1;',
      '}',
      "#layer['mapnik::geometry_type'=3] {",
      '  polygon-fill: <%= polygon.fill.color.fixed %>;',
      '  polygon-opacity: <%= polygon.fill.color.opacity %>;',
      '  ::outline {',
      '    line-color: <%= polygon.stroke.color.fixed%>;',
      '    line-width: <%= polygon.stroke.size.fixed %>;',
      '    line-opacity: <%= polygon.stroke.color.opacity %>;',
      '  }',
      '}'
    ].join('\n'))(DefaultCartography.simple);
  },

  isValidInputGeometryForType: function (simpleGeometryType, analysisType) {
    var validGeometries = this.getValidInputGeometriesForType(analysisType);
    return _.contains(validGeometries, simpleGeometryType) || _.contains(validGeometries, '*');
  },

  getValidInputGeometriesForType: function (analysisType) {
    var params = this.paramsForType(analysisType);

    var geometries = [];

    for (var name in params) {
      var param = params[name];
      if (param.type === 'node') {
        geometries = _.union(geometries, param.geometry);
      }
    }

    return geometries;
  }
};
