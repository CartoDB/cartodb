var _ = require('underscore');
var StaticLegendModelBase = require('./static-legend-model-base');

var HTMLLegendModel = StaticLegendModelBase.extend({
  defaults: function () {
    return _.extend(StaticLegendModelBase.prototype.defaults.apply(this), {
      type: 'html',
      html: ''
    });
  }
});

module.exports = HTMLLegendModel;
