var _ = require('underscore');
var AutoStyler = require('./auto-styler');

function getAttrRegex (attr, multi) {
  return new RegExp('\\' + 's' + attr + ':.*?(;|\n)', multi ? 'g' : '');
}

function removeEmptyLayer (cartocss) {
  return cartocss.replace(/[^;}{]*{((\s|\n)*?)}/g, '');
}

function setFlagInCartocss (cartocss, attr, flag) {
  return cartocss.replace(getAttrRegex(attr, false), flag);
}

function removeAttr (cartocss, attr) {
  return cartocss.replace(getAttrRegex(attr, true), '');
}

function insertCartoCSSAttribute (cartocss, attrib, flag) {
  return cartocss.replace(flag, attrib);
}

module.exports = AutoStyler.extend({
  getStyle: function () {
    var style = this.layer.get('initialStyle');
    if (!style) return;

    ['marker-fill', 'polygon-fill', 'line-color'].forEach(function (item) {
      var flag = '##' + item + '##;';

      style = insertCartoCSSAttribute(
                removeEmptyLayer(
                  removeAttr(
                    setFlagInCartocss(style, item, flag),
                    item
                  )
                ),

                this._generateCategoryRamp(item),
                flag
              );
      // style = style.replace( new RegExp( '\\' + 's' + item + ':.*?(;|\n)', 'g' ), this._generateCategoryRamp( item ) );
    }.bind(this));

    return style;
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
