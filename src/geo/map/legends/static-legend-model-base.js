var _ = require('underscore');
var LegendModelBase = require('./legend-model-base');

var StaticLegendModelBase = LegendModelBase.extend({
  defaults: function () {
    return _.extend(LegendModelBase.prototype.defaults.apply(this), {
      state: LegendModelBase.STATE_SUCCESS
    });
  },

  _onVisReloading: function () {},

  isAvailable: function () { return true; }
});

module.exports = StaticLegendModelBase;
