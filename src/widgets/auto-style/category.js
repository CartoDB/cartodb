var AutoStyler = require('./auto-styler');
var CategoryAutoStyler = AutoStyler.extend({
  getStyle: function () {
    var style = this.layer.get('initialStyle');
    if (!style) return;
    ['marker-fill', 'polygon-fill', 'line-color'].forEach(function (item) {
      style = style.replace(new RegExp('\\' + 's' + item + ':.*?;', 'g'), this._generateCategoryRamp(item));
    }.bind(this));
    return style;
  },

  _generateCategoryRamp: function (sym) {
    var ramp;
    var cats = this.dataviewModel.get('allCategoryNames');
    ramp = sym + ': ' + this.colors.getColorByCategory('OTHER') + ';';
    ramp += cats.map(function (c, i) {
      var color = this.colors.getColorByCategory(c);
      return '[' + this.dataviewModel.get('column') + '=\'' + cats[i] + '\']{\n' + sym + ': ' + color + ';\n}';
    }.bind(this)).join('\n');
    return ramp;
  }
});

module.exports = CategoryAutoStyler;
