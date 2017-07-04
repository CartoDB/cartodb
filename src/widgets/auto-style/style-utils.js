var _ = require('underscore');

function getAttrRegex (attr, multi) {
  return new RegExp('\\' + 's' + attr + ':.*?(;|\n)', multi ? 'g' : '');
}

function setFlagInCartocss (cartocss, attr, flag) {
  var pos = cartocss.search(getAttrRegex(attr, false));
  var insertString = function (str, index, value) {
    return str.substr(0, index) + value + str.substr(index);
  };

  return pos > -1 ? insertString(cartocss, pos, flag) : cartocss;
}

function removeAttr (cartocss, attr) {
  return cartocss.replace(getAttrRegex(attr, true), '');
}

function insertCartoCSSAttribute (cartocss, attrib, flag) {
  return cartocss.replace(flag, attrib);
}

function replaceWrongSpaceChar (cartocss) {
  return cartocss.replace(new RegExp(String.fromCharCode(160), 'g'), ' ');
}
/**
 * Change attr style and remove all the duplicates
 * @param  {String} cartocss cartocss original String
 * @param  {String} attr     CSS Attribute ex, polygon-fill
 * @param  {String} newStyle New attribute style ex, polygon-fill: red;
 * @return {String}          Cartocss modified String
 */
function changeStyle (cartocss, attr, newStyle) {
  var flag = '\n   ##' + attr + '##;\n';

  return insertCartoCSSAttribute(
            removeAttr(
              setFlagInCartocss(cartocss, attr, flag),
              attr
            ),
            newStyle,
            flag
          );
}

module.exports = {
  changeStyle: _.memoize(changeStyle, function (css, attr, style) {
    return css + attr + style;
  }),
  getAttrRegex: getAttrRegex,
  replaceWrongSpaceChar: replaceWrongSpaceChar
};
