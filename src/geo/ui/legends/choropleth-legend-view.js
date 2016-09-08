var LegendViewBase = require('./legend-view-base');
var template = require('./choropleth-legend-template.tpl');

var ChoroplethLegendView = LegendViewBase.extend({
  _getCompiledTemplate: function () {
    return template({
      title: this.model.get('title'),
      colors: this.model.get('colors'),
      prefix: this.model.get('prefix'),
      sufix: this.model.get('sufix')
    });
  }
});

module.exports = ChoroplethLegendView;
