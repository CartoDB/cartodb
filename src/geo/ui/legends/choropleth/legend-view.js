var LegendViewBase = require('../base/legend-view-base');
var template = require('./legend-template.tpl');
var formatter = require('../../../../util/formatter');

var ChoroplethLegendView = LegendViewBase.extend({
  _getCompiledTemplate: function () {
    return template({
      colors: this.model.get('colors'),
      avg: this.model.get('avg'),
      avgPercentage: this._calculateAVGPercentage(),
      prefix: this.model.get('prefix'),
      suffix: this.model.get('suffix'),
      formatter: formatter
    });
  },

  // In order to work with negative values, we need to include the total range
  _calculateAVGPercentage: function () {
    return (this.model.get('avg') - this.model.get('min')) * 100 / (this.model.get('max') - this.model.get('min'));
  }
});

module.exports = ChoroplethLegendView;
