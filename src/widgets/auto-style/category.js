var _ = require('underscore');
var AutoStyler = require('./auto-styler');
var StyleUtils = require('./style-utils');

module.exports = AutoStyler.extend({
  getStyle: function () {
    var style = this.layer.get('initialStyle');
    if (!style) return;

    ['marker-fill', 'polygon-fill', 'line-color'].forEach(function (item) {
      style = StyleUtils.changeStyle(style, item, this._generateCategoryRamp(item));
    }.bind(this));

    return style;
  },

  _generateCategoryRamp: function (sym) {
    var cats = this.dataviewModel.get('data');
    var column = this.dataviewModel.get('column');
    var ramp = 'ramp([' + column + '],';

    var catListColors = '';
    var catListValues = '';

    for (var i = cats.length; i >= 0; i--) {
      var cat = cats[i],
          start = "'",
          end = i > 0 ? "', " : "'";

      catListColors += start + this.colors.getColorByCategory(cat.name) + end;
      if (!cat.agg) {
        catListValues += start + cat.name.replace(/'/g, '\\\'') + end;
      }
    }

    return sym + ': ' + ramp + '(' + catListColors + '), (' + catListValues + '));'
  }
});
