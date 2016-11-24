var _ = require('underscore');
var StaticLegendModelBase = require('./static-legend-model-base');

var CustomChoroplethLegendModel = StaticLegendModelBase.extend({
  defaults: function () {
    return _.extend(StaticLegendModelBase.prototype.defaults.apply(this), {
      type: 'custom_choropleth',
      prefix: '',
      suffix: '',
      leftLabel: '',
      rightLabel: '',
      colors: []
    });
  }
});

module.exports = CustomChoroplethLegendModel;
