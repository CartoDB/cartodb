var LegendModelBase = require('./legend-model-base');

var BubbleLegendModel = LegendModelBase.extend({
  defaults: {
    visible: false,
    type: 'bubble',
    fillColor: '#FABADA'
  },

  isAvailable: function () {
    return !!this.get('bubbles');
  }
});

module.exports = BubbleLegendModel;
