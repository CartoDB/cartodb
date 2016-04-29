var StyleDefaults = require('./style-defaults/style-defaults');
var HeatmapDefaults = require('./style-defaults/heatmap-style-defaults');
var SquareAggregationDefaults = require('./style-defaults/squares-aggregation-style-defaults');
var HexabinsAggregationDefaults = require('./style-defaults/hexabins-aggregation-style-defaults');
var RegionsAggregationDefaults = require('./style-defaults/regions-aggregation-style-defaults');

var STYLE_DEFAULTS_MAP = {
  'simple': StyleDefaults,
  'heatmap': HeatmapDefaults,
  'aggregation': {
    'squares': SquareAggregationDefaults,
    'hexabins': HexabinsAggregationDefaults,
    'regions': RegionsAggregationDefaults
  }
};

module.exports = {
  getDefaultStyleAttrsByType: function (styleType, styleAggrType, geometryType) {
    var StyleDefaultsKlass = STYLE_DEFAULTS_MAP[styleType];
    if (styleType !== 'aggregation') {
      return StyleDefaultsKlass.generateAttributes(geometryType);
    } else {
      return StyleDefaultsKlass[styleAggrType || 'squares'].generateAttributes(geometryType);
    }
  },

  getTypeAttrs: function () {
    return [
      'simple',
      'aggregation',
      'heatmap'
    ];
  },

  getAggregationAttrs: function () {
    return [
      'aggr_type',
      'aggr_size',
      'aggr_resolution',
      'aggr_change', // auto | manual
      'aggr_dataset',
      'aggr_value'
    ];
  }
};
