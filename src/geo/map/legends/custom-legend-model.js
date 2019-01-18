var _ = require('underscore');
var StaticLegendModelBase = require('./static-legend-model-base');

var CustomLegendModel = StaticLegendModelBase.extend({
  defaults: function () {
    return _.extend(StaticLegendModelBase.prototype.defaults.apply(this), {
      type: 'custom',
      items: [],
      html: ''
    });
  }
});

module.exports = CustomLegendModel;
