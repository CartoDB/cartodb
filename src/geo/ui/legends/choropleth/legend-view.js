var DynamicLegendViewBase = require('../base/dynamic-legend-view-base');
var template = require('./legend-template.tpl');

var ChoroplethLegendView = DynamicLegendViewBase.extend({
  _getCompiledTemplate: function () {
    return template({
      colors: this.model.get('colors'),
      prefix: this.model.get('prefix'),
      sufix: this.model.get('sufix')
    });
  }
});

module.exports = ChoroplethLegendView;
