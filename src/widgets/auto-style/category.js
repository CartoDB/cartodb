var _ = require('underscore');
var AutoStyler = require('./auto-styler');

module.exports = AutoStyler.extend({
  getStyle: function () {
    var style = this.layer.get('initialStyle');
    if (!style) return;
    ['marker-fill', 'polygon-fill', 'line-color'].forEach(function (item) {
      style = style.replace(new RegExp('\\' + 's' + item + ':.*?;', 'g'), this._generateCategoryRamp(item));
    }.bind(this));
    return style;
  },

  _generateCategoryRamp: function (sym) {
    var cats = this.dataviewModel.get('data');
    var column = this.dataviewModel.get('column');
    var ramp = ['ramp([' + column + ']'];

    ramp.push(
      '(' +
      cats.map(function (cat, i) {
        return this.colors.getColorByCategory(cat.name);
      }.bind(this)).join(', ') +
      ')'
    );

    ramp.push(
      '(' +
      _.reduce(cats, function (memo, cat, i) {
        if (!cat.agg) {
          memo.push('\'' + cat.name.replace(/'/g, '\\\'') + '\'');
        }
        return memo;
      }, []).join(', ') +
      ')'
    );

    return sym + ': ' + ramp.join(', ') + ');';
  }
});