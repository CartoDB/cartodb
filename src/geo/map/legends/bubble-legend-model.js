var LegendModelBase = require('./legend-model-base');

var BubbleLegendModel = LegendModelBase.extend({
  defaults: {
    visible: false,
    type: 'bubble'
  }
});

module.exports = BubbleLegendModel;
