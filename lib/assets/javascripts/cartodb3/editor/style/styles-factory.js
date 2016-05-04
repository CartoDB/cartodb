var _ = require('underscore');
var StyleDefaults = require('./style-defaults/style-defaults');
var HeatmapDefaults = require('./style-defaults/heatmap-style-defaults');
var SquareAggregationDefaults = require('./style-defaults/squares-aggregation-style-defaults');
var HexabinsAggregationDefaults = require('./style-defaults/hexabins-aggregation-style-defaults');
var RegionsAggregationDefaults = require('./style-defaults/regions-aggregation-style-defaults');

var STYLE_MAP = {
  'simple': {
    labelTranslationKey: 'editor.style.types.simple',
    formModelKlass: '',
    defaultStyles: StyleDefaults
  },
  'squares': {
    labelTranslationKey: 'editor.style.types.squares',
    formModelKlass: '',
    defaultStyles: SquareAggregationDefaults
  },
  'hexabins': {
    labelTranslationKey: 'editor.style.types.hexabins',
    formModelKlass: '',
    defaultStyles: HexabinsAggregationDefaults
  },
  'regions': {
    labelTranslationKey: 'editor.style.types.regions',
    formModelKlass: '',
    defaultStyles: RegionsAggregationDefaults
  },
  'heatmap': {
    labelTranslationKey: 'editor.style.types.heatmap',
    formModelKlass: '',
    defaultStyles: HeatmapDefaults
  }
};

module.exports = {
  getDefaultStyleAttrsByType: function (styleType, geometryType) {
    var StyleDefaultsKlass = STYLE_MAP[styleType].defaultStyles;
    return StyleDefaultsKlass.generateAttributes(geometryType);
  },

  createStyleFormModel: function (styleModel, layerTableModel) {
    var styleType = styleModel.get('type');
    var Klass = STYLE_MAP[styleType].formModelKlass;
    return new Klass(styleModel.attributes, {
      parse: true,
      layerTableModel: layerTableModel
    });
  },

  getStyleTypes: function (layerTableModel) {
    return _.reduce(STYLE_MAP, function (memo, val, key) {
      if (val.checkIfValid ? val.checkIfValid(layerTableModel) : true) {
        memo.push({
          value: key,
          label: _t(val.labelTranslationKey)
        });
      }
      return memo;
    }, []);
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
