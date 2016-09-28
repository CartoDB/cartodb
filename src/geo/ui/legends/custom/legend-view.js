var LegendViewBase = require('../base/legend-view-base');
var template = require('./legend-template.tpl');

var CustomLegendView = LegendViewBase.extend({
  _getCompiledTemplate: function () {
    return template({
      items: this.model.get('items')
    });
  }
});

module.exports = CustomLegendView;
