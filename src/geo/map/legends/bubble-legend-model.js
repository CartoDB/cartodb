var _ = require('underscore');
var DynamicLegendModelBase = require('./dynamic-legend-model-base');

var BubbleLegendModel = DynamicLegendModelBase.extend({
  TYPE: 'bubble',

  defaults: function () {
    return _.extend({
      fillColor: '#FABADA',
      prefix: '',
      suffix: ''
    }, DynamicLegendModelBase.prototype.defaults.apply(this));
  },

  hasData: function () {
    return this.get('values') && this.get('values').length > 0;
  }
});

module.exports = BubbleLegendModel;
