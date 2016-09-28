var _ = require('underscore');
var LegendModelBase = require('./legend-model-base');

var CustomLegendModel = LegendModelBase.extend({
  TYPE: 'custom',

  defaults: function () {
    return _.extend({
      items: []
    }, LegendModelBase.prototype.defaults.apply(this));
  }
});

module.exports = CustomLegendModel;
