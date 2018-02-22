var _ = require('underscore');
var StyleDefaults = require('./style-defaults/style-defaults');
var SimpleStyleDefaults = require('./style-defaults/simple-style-defaults');
var HeatmapDefaults = require('./style-defaults/heatmap-style-defaults');
var AnimationDefaults = require('./style-defaults/animation-style-defaults');
var SquareAggregationDefaults = require('./style-defaults/squares-aggregation-style-defaults');
var HexabinsAggregationDefaults = require('./style-defaults/hexabins-aggregation-style-defaults');
var RegionsAggregationDefaults = require('./style-defaults/regions-aggregation-style-defaults');

var STYLE_MAP = {
  'none': {
    tooltipTranslationKey: 'editor.style.tooltip.none',
    labelTranslationKey: 'editor.style.types.none',
    checkIfValid: function (geometryType) {
      return !geometryType;
    },
    defaultStyles: StyleDefaults
  },
  'simple': {
    tooltipTranslationKey: 'editor.style.style-form.aggregation.tooltips.simple',
    labelTranslationKey: 'editor.style.types.simple',
    iconTemplate: require('./style-icons/points.tpl'),
    checkIfValid: function (geometryType) {
      return !!geometryType;
    },
    defaultStyles: SimpleStyleDefaults
  },
  'squares': {
    tooltipTranslationKey: 'editor.style.style-form.aggregation.tooltips.squares',
    labelTranslationKey: 'editor.style.types.squares',
    iconTemplate: require('./style-icons/squares.tpl'),
    checkIfValid: function (geometryType) {
      return geometryType === 'point';
    },
    defaultStyles: SquareAggregationDefaults
  },
  'hexabins': {
    tooltipTranslationKey: 'editor.style.style-form.aggregation.tooltips.hexabins',
    labelTranslationKey: 'editor.style.types.hexabins',
    iconTemplate: require('./style-icons/hexabins.tpl'),
    checkIfValid: function (geometryType) {
      return geometryType === 'point';
    },
    defaultStyles: HexabinsAggregationDefaults
  },
  'regions': {
    tooltipTranslationKey: 'editor.style.style-form.aggregation.tooltips.regions',
    labelTranslationKey: 'editor.style.types.regions',
    iconTemplate: require('./style-icons/regions.tpl'),
    checkIfValid: function (geometryType) {
      return geometryType === 'point';
    },
    defaultStyles: RegionsAggregationDefaults
  },
  'animation': {
    tooltipTranslationKey: 'editor.style.style-form.aggregation.tooltips.animation',
    labelTranslationKey: 'editor.style.types.animation',
    iconTemplate: require('./style-icons/animated.tpl'),
    checkIfValid: function (geometryType) {
      return geometryType === 'point';
    },
    defaultStyles: AnimationDefaults
  },
  'heatmap': {
    tooltipTranslationKey: 'editor.style.style-form.aggregation.tooltips.heatmap',
    labelTranslationKey: 'editor.style.types.heatmap',
    iconTemplate: require('./style-icons/heatmap.tpl'),
    checkIfValid: function (geometryType) {
      return geometryType === 'point';
    },
    defaultStyles: HeatmapDefaults
  }
};

module.exports = {
  getDefaultStyleAttrsByType: function (styleType, geometryType) {
    var StyleDefaultsKlass = STYLE_MAP[styleType].defaultStyles;
    return StyleDefaultsKlass.generateAttributes(geometryType);
  },

  getStyleTypes: function (currentType, geometryType) {
    return _.reduce(STYLE_MAP, function (memo, val, key) {
      if (currentType === key || (val.checkIfValid ? val.checkIfValid(geometryType) : true)) {
        memo.push({
          value: key,
          label: _t(val.labelTranslationKey),
          tooltip: _t(val.tooltipTranslationKey),
          iconTemplate: val.iconTemplate
        });
      }
      return memo;
    }, []);
  },

  getFormTemplateByType: function (styleType) {
    return STYLE_MAP[styleType].formTemplate;
  },

  getAggregationTypes: function () {
    return ['squares', 'hexabins', 'regions'];
  }
};
