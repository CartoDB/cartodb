var LegendViewBase = require('./legend-view-base');
var template = require('./category-legend-template.tpl');

var CategoryLegendView = LegendViewBase.extend({
  _getCompiledTemplate: function () {
    return template({
      title: this.model.get('title'),
      categories: this.model.get('categories')
    });
  }
});

module.exports = CategoryLegendView;
