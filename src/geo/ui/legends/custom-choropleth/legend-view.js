var LegendViewBase = require('../base/legend-view-base');
var template = require('./legend-template.tpl');

var ChoroplethLegendView = LegendViewBase.extend({
  _getCompiledTemplate: function () {
    return template({
      colors: this.model.get('colors'),
      prefix: this.model.get('prefix'),
      suffix: this.model.get('suffix')
    });
  }
});

module.exports = ChoroplethLegendView;
