var _ = require('underscore');
var DynamicLegendModelBase = require('./dynamic-legend-model-base');

var ChoroplethLegendModel = DynamicLegendModelBase.extend({
  TYPE: 'choropleth',

  defaults: function () {
    return _.extend({
      prefix: '',
      suffix: ''
    }, DynamicLegendModelBase.prototype.defaults.apply(this));
  },

  hasData: function () {
    return this.get('colors') && this.get('colors').length > 0;
  }
});

module.exports = ChoroplethLegendModel;
