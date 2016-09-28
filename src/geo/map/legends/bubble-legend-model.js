var _ = require('underscore');
var LegendModelBase = require('./legend-model-base');

var BubbleLegendModel = LegendModelBase.extend({
  defaults: function () {
    return _.extend(LegendModelBase.prototype.defaults.apply(this), {
      type: 'bubble',
      fillColor: '',
      prefix: '',
      suffix: ''
    });
  },

  isAvailable: function () {
    return this.get('values') && this.get('values').length > 0;
  }
});

module.exports = BubbleLegendModel;
