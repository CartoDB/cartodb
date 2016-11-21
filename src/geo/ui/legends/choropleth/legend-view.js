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
      labels: this._getLabels(),
      formatter: formatter
    });
  },

  _getLabels: function () {
    var colors = this.model.get('colors');
    var leftLabel = this.model.get('leftLabel');
    var rightLabel = this.model.get('rightLabel');
    var o = {};
    o.left = formatter.formatNumber(colors[0].label);
    o.right = formatter.formatNumber(colors[colors.length - 1].label);
    if (leftLabel != null && leftLabel !== '') {
      o.left = leftLabel;
    }

    if (rightLabel != null && rightLabel !== '') {
      o.right = rightLabel;
    }

    return o;
  },

  // In order to work with negative values, we need to include the total range
  _calculateAVGPercentage: function () {
    return (this.model.get('avg') - this.model.get('min')) * 100 / (this.model.get('max') - this.model.get('min'));
  }
});

module.exports = ChoroplethLegendView;
