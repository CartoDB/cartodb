var _ = require('underscore');
var StyleDefaults = require('./style-defaults/style-defaults');
var HeatmapDefaults = require('./style-defaults/heatmap-style-defaults');
var SquareAggregationDefaults = require('./style-defaults/squares-aggregation-style-defaults');
var HexabinsAggregationDefaults = require('./style-defaults/hexabins-aggregation-style-defaults');
var RegionsAggregationDefaults = require('./style-defaults/regions-aggregation-style-defaults');

var STYLE_MAP = {
  'simple': {
    labelTranslationKey: 'editor.style.types.simple',
    formPropertiesModelKlass: require('./style-form/simple-style-form/simple-style-properties-form-model'),
    formAggregationModelKlass: null,
    formTemplate: require('./style-form/simple-style-form/simple-style-form.tpl'),
    defaultStyles: StyleDefaults
  },
  'squares': {
    labelTranslationKey: 'editor.style.types.squares',
    formPropertiesModelKlass: require('./style-form/simple-style-form/simple-style-properties-form-model'),
    formAggregationModelKlass: null,
    formTemplate: require('./style-form/aggregation-style-form/aggregation-style-form.tpl'),
    defaultStyles: SquareAggregationDefaults
  },
  'hexabins': {
    labelTranslationKey: 'editor.style.types.hexabins',
    formPropertiesModelKlass: require('./style-form/simple-style-form/simple-style-properties-form-model'),
    formAggregationModelKlass: null,
    formTemplate: require('./style-form/aggregation-style-form/aggregation-style-form.tpl'),
    defaultStyles: HexabinsAggregationDefaults
  },
  'regions': {
    labelTranslationKey: 'editor.style.types.regions',
    formPropertiesModelKlass: require('./style-form/simple-style-form/simple-style-properties-form-model'),
    formAggregationModelKlass: null,
    formTemplate: require('./style-form/aggregation-style-form/aggregation-style-form.tpl'),
    defaultStyles: RegionsAggregationDefaults
  },
  'heatmap': {
    labelTranslationKey: 'editor.style.types.heatmap',
    formPropertiesModelKlass: require('./style-form/simple-style-form/simple-style-properties-form-model'),
    formAggregationModelKlass: null,
    formTemplate: require('./style-form/aggregation-style-form/aggregation-style-form.tpl'),
    defaultStyles: HeatmapDefaults
  }
};

module.exports = {
  getDefaultStyleAttrsByType: function (styleType, geometryType) {
    var StyleDefaultsKlass = STYLE_MAP[styleType].defaultStyles;
    return StyleDefaultsKlass.generateAttributes(geometryType);
  },

  createStylePropertiesFormModel: function (styleModel, layerTableModel) {
    var styleType = styleModel.get('type');
    var Klass = STYLE_MAP[styleType].formPropertiesModelKlass;
    return new Klass(styleModel.attributes, {
      parse: true,
      styleModel: styleModel,
      layerTableModel: layerTableModel
    });
  },

  createStyleAggregationFormModel: function (styleModel, layerTableModel) {
    var styleType = styleModel.get('type');
    var Klass = STYLE_MAP[styleType].formAggregationModelKlass;
    if (Klass) {
      return new Klass(styleModel.attributes, {
        parse: true,
        styleModel: styleModel,
        layerTableModel: layerTableModel
      });
    } else {
      return false;
    }
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
