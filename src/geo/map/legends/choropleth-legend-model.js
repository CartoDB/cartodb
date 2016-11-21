var _ = require('underscore');
var LegendModelBase = require('./legend-model-base');

var ChoroplethLegendModel = LegendModelBase.extend({
  defaults: function () {
    return _.extend(LegendModelBase.prototype.defaults.apply(this), {
      type: 'choropleth',
      prefix: '',
      suffix: '',
      leftLabel: '',
      rightLabel: '',
      colors: []
    });
  },

  getNonResettableAttrs: function () {
    return _.union(
      LegendModelBase.prototype.getNonResettableAttrs.apply(this),
      ['colors']
    );
  },

  isAvailable: function () {
    return this.get('colors') && this.get('colors').length > 0;
  }
});

module.exports = ChoroplethLegendModel;
