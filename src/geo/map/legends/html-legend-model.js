var _ = require('underscore');
var LegendModelBase = require('./legend-model-base');

var HTMLLegendModel = LegendModelBase.extend({
  TYPE: 'html',

  defaults: function () {
    return _.extend({
      html: ''
    }, LegendModelBase.prototype.defaults.apply(this));
  }
});

module.exports = HTMLLegendModel;
