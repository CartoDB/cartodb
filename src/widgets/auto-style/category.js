var AutoStyler = require('./auto-styler');
var StyleUtils = require('./style-utils');
var _ = require('underscore');

module.exports = AutoStyler.extend({
  getStyle: function () {
    var style = this.layer.get('initialStyle');
    if (!style) return;

    ['marker-fill', 'polygon-fill', 'line-color'].forEach(function (item) {
      style = StyleUtils.changeStyle(style, item, this._generateCategoryRamp(item));
    }.bind(this));

    return StyleUtils.replaceWrongSpaceChar(style);
  },

  getRange: function () {
    return _.map(this.dataviewModel.get('data'), function (category) {
        return this.colors.getColorByCategory(category.name);
    }, this);
  },

  getDef: function () {
    var model = this.dataviewModel;
    var categories = model.get('data');
    var range = this.getRange();
    var definitions = {};

    ['marker-fill', 'polygon-fill', 'line-color'].forEach(function (item) {
      var geom = item.substring(0, item.indexOf('-'));
      definitions[geom === 'marker' ? 'point' : geom] = { color:
        { domain: _.pluck(categories, 'name'), range: range, attribute: model.get('column') }
      };
    });

    return definitions;
  },

  _generateCategoryRamp: function (sym) {
    var model = this.dataviewModel;
    var categories = model.get('data');
    var column = model.get('column');

    return sym + ': ' + this._getCategoryRamp(categories, column);
  },

  _getCategoryRamp: function (categories, column) {
    var ramp = 'ramp([' + column + '], ';

    var catListColors = '';
    var catListValues = '';

    for (var i = 0; i < categories.length; i++) {
      var cat = categories[i];
      var start = "'";
      var end = i !== categories.length - 1 ? "', " : "'";

      catListColors += start + this.colors.getColorByCategory(cat.name) + end;
      if (!cat.agg) {
        catListValues += start + cat.name.replace(/'/g, '\\\'') + end;
      } else if (end === "'") {
        catListValues = catListValues.substring(0, catListValues.length - 2);
      }
    }

    return ramp + '(' + catListColors + '), (' + catListValues + '));';
  }
});
