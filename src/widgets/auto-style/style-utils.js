var _ = require('underscore');
var postcss = require('postcss');

function getAttrRegex (attr, multi) {
  return new RegExp('\\' + 's' + attr + ':.*?(;|\n)', multi ? 'g' : '');
}

function replaceWrongSpaceChar (cartocss) {
  return cartocss.replace(new RegExp(String.fromCharCode(160), 'g'), ' ');
}

/**
 * Change attr style and remove all the duplicates
 * @param  {String} cartocss cartocss original String
 * @param  {String} attr     CSS Attribute ex, polygon-fill
 * @param  {String} newStyle New attribute style ex, red;
 * @return {String}          Cartocss modified String
 */
function changeStyle (cartocss, attr, newStyle) {
  var cssTree = postcss().process(cartocss);
  var root = cssTree.result.root;

  root.walk(function (node) {
    if (node.type === 'decl' && node.prop === attr) {
      node.value = newStyle;
    }
  });

  return cssTree.css;
}

module.exports = {
  changeStyle: _.memoize(changeStyle, function (css, attr, style) {
    return css + attr + style;
  }),
  getAttrRegex: getAttrRegex,
  replaceWrongSpaceChar: replaceWrongSpaceChar
};
