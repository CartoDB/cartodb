var StyleDefaults = require('./style-defaults');
var HeatmapDefaults = require('./heatmap-style-defaults');

module.exports = {
  getDefaultStyleAttrsByType: function (styleType, geometryType) {
    switch (styleType) {
      case 'simple':
        return StyleDefaults.generateAttributes(geometryType);
      case 'heatmap':
        return HeatmapDefaults.generateAttributes(geometryType);
      default:
        console.log('Style ' + styleType + ' not defined');
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
      'aggr_value',
      'aggr_resolution',
      'aggr_change', // auto | manual
      'aggr_dataset',
      'aggr_value'
    ];
  }
};
