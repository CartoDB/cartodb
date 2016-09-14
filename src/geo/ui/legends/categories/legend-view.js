var DynamicLegendViewBase = require('../base/dynamic-legend-view-base');
var template = require('./legend-template.tpl');

var CategoryLegendView = DynamicLegendViewBase.extend({
  _getCompiledTemplate: function () {
    return template({
      categories: this.model.get('categories')
    });
  }
});

module.exports = CategoryLegendView;
