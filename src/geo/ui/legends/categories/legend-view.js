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
    var _default = this.model.get('default');
    if (_default) {
      categories.push({
        title: 'Others',
        icon: _default.icon,
        color: _default.color
      });
    }
    return categories;
  }
});

module.exports = CategoryLegendView;
