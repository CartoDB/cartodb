var LegendViewBase = require('../base/legend-view-base');
var template = require('./legend-template.tpl');

var CategoryLegendView = LegendViewBase.extend({
  _getCompiledTemplate: function () {
    return template({
      categories: this._getCategories()
    });
  },

  _getCategories: function () {
    var categories = this.model.get('categories').slice(0);
    if (this.model.get('defaultColor')) {
      categories.push({
        title: 'Others',
        icon: '',
        color: this.model.get('defaultColor')
      });
    }
    return categories;
  }
});

module.exports = CategoryLegendView;
