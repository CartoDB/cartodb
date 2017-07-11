var _ = require('underscore');
var postcss = require('postcss');

function isPropertyIncluded (cartocss, attr) {
  var cssTree = postcss().process(cartocss);
  var root = cssTree.result.root;
  var propertyIncluded = false;

  root.walk(function (node) {
    var parentNode = node.parent;
    if (node.type === 'decl' && node.prop === attr) {
      if (!isSelectorRule(parentNode) || isMapnikGeometrySelectorRule(parentNode)) {
        propertyIncluded = true;
      }
    }
  });

  return propertyIncluded;
}

function isMapnikGeometrySelectorRule (node) {
  return node.type === 'rule' && node.selector.search('mapnik::geometry_type') !== -1;
}

function isSelectorRule (node) {
  return node.type === 'rule' && node.selector.search(/\[(.)+\]/g) !== -1;
}

function isOutlineRule (node) {
  return node.type === 'rule' && node.selector.search('::outline') === 0;
}

function replaceWrongSpaceChar (cartocss) {
  return cartocss.replace(new RegExp(String.fromCharCode(160), 'g'), ' ');
}

/**
 * Change attr style and remove all the duplicates
 * @param  {String} cartocss cartocss original String
 * @param  {String} attr     CSS Attribute ex, polygon-fill
 * @param  {String} newStyle New style value ex, red;
 * @return {String}          Cartocss modified String
 */
function changeStyle (cartocss, attr, newStyle) {
  var cssTree = postcss().process(cartocss);
  var root = cssTree.result.root;
  var attributeAlreadyChanged = false;

  root.walk(function (node) {
    var parentNode = node.parent;
    if (node.type === 'decl' && node.prop === attr) {
      // Don't change/remove declarations under ::ouline symbolizer
      if (!(isOutlineRule(parentNode) && attr === 'line-color')) {
        if (isSelectorRule(parentNode) || attributeAlreadyChanged) {
          // If the attribute is inside a conditional selection, it has to be removed
          node.remove();
        } else {
          // If the attribute is inside a regular root (or symbolizer), it just
          // changes the value
          node.value = newStyle;
          attributeAlreadyChanged = true;
        }
      }
    }
  });

  return cssTree.css;
}

module.exports = {
  changeStyle: _.memoize(changeStyle, function (css, attr, style) {
    return css + attr + style;
  }),
  isPropertyIncluded: isPropertyIncluded,
  replaceWrongSpaceChar: replaceWrongSpaceChar
};
