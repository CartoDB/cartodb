var LegendViewBase = require('../base/legend-view-base');
var template = require('./legend-template.tpl');

var ChoroplethLegendView = LegendViewBase.extend({
  _getCompiledTemplate: function () {
    return template({
      colors: this.model.get('colors'),
      prefix: this.model.get('prefix'),
      suffix: this.model.get('suffix'),
      hasCustomLabels: this._hasCustomLabels(),
      leftLabel: this.model.get('leftLabel'),
      rightLabel: this.model.get('rightLabel')
    });
  },

  _hasCustomLabels: function () {
    var leftLabel = this.model.get('leftLabel');
    var rightLabel = this.model.get('rightLabel');
    return ((leftLabel != null && leftLabel !== '') || (rightLabel != null && rightLabel !== ''));
  }
});

module.exports = ChoroplethLegendView;
