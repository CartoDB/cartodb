var _ = require('underscore');
var StyleDefaults = require('./style-defaults/style-defaults');
var SimpleStyleDefaults = require('./style-defaults/simple-style-defaults');
var HeatmapDefaults = require('./style-defaults/heatmap-style-defaults');
var SquareAggregationDefaults = require('./style-defaults/squares-aggregation-style-defaults');
var HexabinsAggregationDefaults = require('./style-defaults/hexabins-aggregation-style-defaults');
var RegionsAggregationDefaults = require('./style-defaults/regions-aggregation-style-defaults');

var STYLE_MAP = {
  'none': {
    labelTranslationKey: 'editor.style.types.none',
    checkIfValid: function (geometryType) {
      return !geometryType;
    },
    defaultStyles: StyleDefaults
  },
  'simple': {
    labelTranslationKey: 'editor.style.types.simple',
    checkIfValid: function (geometryType) {
      return !!geometryType;
    },
    defaultStyles: SimpleStyleDefaults
  },
  'squares': {
    labelTranslationKey: 'editor.style.types.squares',
    checkIfValid: function (geometryType) {
      return !!geometryType;
    },
    defaultStyles: SquareAggregationDefaults
  },
  'hexabins': {
    labelTranslationKey: 'editor.style.types.hexabins',
    checkIfValid: function (geometryType) {
      return !!geometryType;
    },
    defaultStyles: HexabinsAggregationDefaults
  },
  'regions': {
    labelTranslationKey: 'editor.style.types.regions',
    checkIfValid: function (geometryType) {
      return !!geometryType;
    },
    defaultStyles: RegionsAggregationDefaults
  },
  'heatmap': {
    labelTranslationKey: 'editor.style.types.heatmap',
    checkIfValid: function (geometryType) {
      return !!geometryType;
    },
    defaultStyles: HeatmapDefaults
  }
};

module.exports = {
  getDefaultStyleAttrsByType: function (styleType, geometryType) {
    var StyleDefaultsKlass = STYLE_MAP[styleType].defaultStyles;
    return StyleDefaultsKlass.generateAttributes(geometryType);
  },

  getStyleTypes: function (geometryType) {
    return _.reduce(STYLE_MAP, function (memo, val, key) {
      if (val.checkIfValid ? val.checkIfValid(geometryType) : true) {
        memo.push({
          value: key,
          label: _t(val.labelTranslationKey)
        });
      }
      return memo;
    }, []);
  },

  getFormTemplateByType: function (styleType) {
    return STYLE_MAP[styleType].formTemplate;
  },

  getAggregationAttrs: function () {
    return [
      'aggr_size',
      'aggr_resolution',
      'aggr_change', // auto | manual
      'aggr_dataset',
      'aggr_value'
    ];
  }
};
