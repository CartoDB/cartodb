var LegendModelBase = require('./legend-model-base');

var ChoroplethLegendModel = LegendModelBase.extend({
  defaults: {
    visible: false,
    type: 'choropleth',
    prefix: '',
    sufix: ''
  },

  isAvailable: function () {
    return !!this.get('colors');
  }
});

module.exports = ChoroplethLegendModel;
