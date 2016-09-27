var DynamicLegendViewBase = require('../base/dynamic-legend-view-base');
var template = require('./legend-template.tpl');

var CategoryLegendView = DynamicLegendViewBase.extend({
  _getCompiledTemplate: function () {
    return template({
      categories: this._getCategories()
    });
  },

  _getCategories: function () {
    var categories = this.model.get('categories').slice(0);
    if (this.model.get('defaultValue')) {
      categories.push({
        label: 'Others', value: this.model.get('defaultValue')
      });
    }
    return categories;
  }
});

module.exports = CategoryLegendView;
