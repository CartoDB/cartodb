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
    labelTranslationKey: 'editor.style.types.none',
    checkIfValid: function (geometryType) {
      return !geometryType;
    },
    defaultStyles: StyleDefaults
  },
  'simple': {
    labelTranslationKey: 'editor.style.types.simple',
    iconTemplate: function (geometryType) {
      if (geometryType === 'polygon') {
        return require('./style-icons/polygons.tpl')();
      } else if (geometryType === 'line') {
        return require('./style-icons/lines.tpl')();
      } else {
        return require('./style-icons/points.tpl')();
      }
    },
    checkIfValid: function (geometryType) {
      return !!geometryType;
    },
    defaultStyles: SimpleStyleDefaults
  },
  'squares': {
    labelTranslationKey: 'editor.style.types.squares',
    iconTemplate: function () {
      return require('./style-icons/squares.tpl')();
    },
    checkIfValid: function (geometryType) {
      return geometryType === 'point';
    },
    defaultStyles: SquareAggregationDefaults
  },
  'hexabins': {
    labelTranslationKey: 'editor.style.types.hexabins',
    iconTemplate: function () {
      return require('./style-icons/hexabins.tpl')();
    },
    checkIfValid: function (geometryType) {
      return geometryType === 'point';
    },
    defaultStyles: HexabinsAggregationDefaults
  },
  'regions': {
    labelTranslationKey: 'editor.style.types.regions',
    iconTemplate: function () {
      return require('./style-icons/regions.tpl')();
    },
    checkIfValid: function (geometryType) {
      return geometryType === 'point';
    },
    defaultStyles: RegionsAggregationDefaults
  },
  'heatmap': {
    labelTranslationKey: 'editor.style.types.heatmap',
    iconTemplate: function () {
      return require('./style-icons/heatmap.tpl')();
    },
    checkIfValid: function (geometryType) {
      return geometryType === 'point';
    },
    defaultStyles: HeatmapDefaults
  },
  'animation': {
    labelTranslationKey: 'editor.style.types.animation',
    iconTemplate: function () {
      return require('./style-icons/animated.tpl')();
    },
    checkIfValid: function (geometryType) {
      return geometryType === 'point';
    },
    defaultStyles: AnimationDefaults
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
