var LegendModelBase = require('./legend-model-base');

var CustomLegendModel = LegendModelBase.extend({
  defaults: {
    visible: false,
    type: 'custom'
  },

  isAvailable: function () {
    return true;
  }
});

module.exports = CustomLegendModel;
