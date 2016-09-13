var LegendViewBase = require('./legend-view-base');
var template = require('./custom-legend-template.tpl');

var CustomLegendView = LegendViewBase.extend({
  _getCompiledTemplate: function () {
    return template({
      items: this.model.get('items')
    });
  }
});

module.exports = CustomLegendView;
