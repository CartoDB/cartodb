var DynamicLegendViewBase = require('../base/dynamic-legend-view-base');
var template = require('./legend-template.tpl');
var formatter = require('../../../../util/formatter');

var ChoroplethLegendView = DynamicLegendViewBase.extend({
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

  _calculateAVGPercentage: function () {
    return this.model.get('avg') * 100 / this.model.get('max');
  }
});

module.exports = ChoroplethLegendView;
