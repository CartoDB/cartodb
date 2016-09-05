var LegendModelBase = require('./legend-model-base');

var CategoryLegendModel = LegendModelBase.extend({
  defaults: {
    visible: false,
    type: 'category'
  }
});

module.exports = CategoryLegendModel;
