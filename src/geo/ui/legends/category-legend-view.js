var LegendViewBase = require('./legend-view-base');
var template = require('./category-legend-template.tpl');

var CategoryLegendView = LegendViewBase.extend({
  _getCompiledTemplate: function () {
    return template({
      title: this.model.get('title'),
      categories: this.model.get('categories'),
      prefix: this.model.get('prefix'),
      sufix: this.model.get('sufix')
    });
  }
});

module.exports = CategoryLegendView;
