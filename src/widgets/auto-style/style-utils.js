var _ = require('underscore');
var postcss = require('postcss');
var stripInlineComments = require('postcss-strip-inline-comments');
var SCSSsyntax = require('postcss-scss');

var OUTLINE_ATTRS = ['line-color', 'line-opacity'];

function generateCSSTreeFromCartoCSS (cartocss) {
  return postcss()
    .use(stripInlineComments)
    .process(cartocss, { syntax: SCSSsyntax });
}

function isPropertyIncluded (cartocss, attr) {
  var cssTree = generateCSSTreeFromCartoCSS(cartocss);
  var root = cssTree.result.root;
  var propertyIncluded = false;

  if (root) {
    root.walkDecls(attr, function (node) {
      var parentNode = node.parent;

      if (!isSelectorRule(parentNode) || isMapnikGeometrySelectorRule(parentNode)) {
        propertyIncluded = true;
      }
    });
  }

  return propertyIncluded;
}

function isSelectorRule (node) {
  return node.type === 'rule' && node.selector.search(/\[(.)+\]/g) !== -1;
}

function isMapnikGeometrySelectorRule (node) {
  return isSelectorRule(node) && node.selector.search('mapnik::geometry_type') !== -1;
}

function isOutlineRule (node) {
  return node.type === 'rule' && node.selector.search('::outline') !== -1;
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
  if (_.isUndefined(newStyle)) return cartocss;

  var cssTree = generateCSSTreeFromCartoCSS(cartocss);
  var root = cssTree.result.root;
  var attributeAlreadyChanged = false;

  if (root) {
    root.walkDecls(attr, function (node) {
      var parentNode = node.parent;

      if (!(isOutlineRule(parentNode) && _.contains(OUTLINE_ATTRS, attr))) {
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
    });

    return cssTree.css;
  }

  return cartocss;
}

module.exports = {
  changeStyle: _.memoize(changeStyle, function (css, attr, style) {
    return css + attr + style;
  }),
  isPropertyIncluded: isPropertyIncluded,
  replaceWrongSpaceChar: replaceWrongSpaceChar
};
