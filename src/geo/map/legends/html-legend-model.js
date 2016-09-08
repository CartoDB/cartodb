var LegendModelBase = require('./legend-model-base');

var HTMLLegendModel = LegendModelBase.extend({
  defaults: {
    visible: true,
    type: 'html'
  },

  isAvailable: function () {
    return true;
  }
});

module.exports = HTMLLegendModel;
