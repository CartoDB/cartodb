var LegendViewBase = require('./legend-view-base');
var template = require('./html-legend-template.tpl');

var HTMLLegendView = LegendViewBase.extend({
  _getCompiledTemplate: function () {
    return template({
      title: this.model.get('title'),
      html: this.model.get('html')
    });
  }
});

module.exports = HTMLLegendView;
