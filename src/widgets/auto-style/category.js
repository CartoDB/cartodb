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

    return StyleUtils.replaceWrongSpaceChar(style);
  },

  _generateCategoryRamp: function (sym) {
    var cats = this.dataviewModel.get('data');
    var column = this.dataviewModel.get('column');
    var ramp = ['ramp([' + column + ']'];
    var catListColors = cats.map(function (cat, i) {
      return this.colors.getColorByCategory(cat.name);
    }.bind(this)).join(', ');
    var catListValues = _.reduce(cats, function (memo, cat, i) {
      if (!cat.agg) {
        memo.push('\'' + cat.name.replace(/'/g, '\\\'') + '\'');
      }
      return memo;
    }, []).join(', ');

    ramp.push('(' + catListColors + ')');
    ramp.push('(' + catListValues + ')');

    return sym + ': ' + ramp.join(', ') + ');';
  }
});
