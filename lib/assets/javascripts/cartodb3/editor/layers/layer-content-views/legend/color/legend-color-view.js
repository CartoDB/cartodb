var LegendTypes = require('./legend-color-types');
var LegendTypeBaseView = require('../legend-base-type-view');

module.exports = LegendTypeBaseView.extend({
  initialize: function (opts) {
    this.legendTypes = LegendTypes;
    LegendTypeBaseView.prototype.initialize.call(this, opts);
  }
});
