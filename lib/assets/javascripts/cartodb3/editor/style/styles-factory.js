var StyleDefaults = require('./style-defaults/style-defaults');
var HeatmapDefaults = require('./style-defaults/heatmap-style-defaults');
var SquareAggregationDefaults = require('./style-defaults/squares-aggregation-style-defaults');
var HexabinsAggregationDefaults = require('./style-defaults/hexabins-aggregation-style-defaults');
var RegionsAggregationDefaults = require('./style-defaults/regions-aggregation-style-defaults');

var STYLE_DEFAULTS_MAP = {
  'simple': StyleDefaults,
  'squares': SquareAggregationDefaults,
  'hexabins': HexabinsAggregationDefaults,
  'regions': RegionsAggregationDefaults,
  'heatmap': HeatmapDefaults
};

module.exports = {
  getDefaultStyleAttrsByType: function (styleType, geometryType) {
    var StyleDefaultsKlass = STYLE_DEFAULTS_MAP[styleType];
    return StyleDefaultsKlass.generateAttributes(geometryType);
  },

  getTypeAttrs: function () {
    return [
      'simple',
      'squares',
      'hexabins',
      'regions',
      'heatmap'
    ];
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
