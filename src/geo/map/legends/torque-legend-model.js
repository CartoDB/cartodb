var _ = require('underscore');
var StaticLegendModelBase = require('./static-legend-model-base');

var TorqueLegendModel = StaticLegendModelBase.extend({
  defaults: function () {
    return _.extend(StaticLegendModelBase.prototype.defaults.apply(this), {
      type: 'torque',
      items: [],
      html: ''
    });
  }
});

module.exports = TorqueLegendModel;
