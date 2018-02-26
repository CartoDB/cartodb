var _ = require('underscore');
var DEFAULT_VALUES = {
  top: 0,
  left: 0
};
var MIN_GAP = 10;
var MIN_HEIGHT = 205;
var MIN_WIDTH = 244;

/**
 * Would you like to know where to open a context menu?
 * Just provide:
 * @param {Object} options.parentView               Parent element view
 * @param {Number} options.posX                     Position X of the context menu
 * @param {Number} options.posY                     Position Y of the context menu
 * @param {Number} options.elementWidth (optional)  Context menu width
 * @param {Number} options.elementHeight (optional) Context menu height
 * @param {Number} options.offsetX (optional)       Context menu offsetX
 * @param {Number} options.offsetY (optional)       Context menu offsetY
 *
 * By default, it will try to positionate to the right (inside) and to
 * the top (below).
 */

var MagicPositioner = function (params) {
  if (!params.parentView) throw new Error('parentView within params is required');
  if (!_.isNumber(params.posX)) throw new Error('posX within params is required');
  if (!_.isNumber(params.posY)) throw new Error('posY within params is required');

  var $parentView = params.parentView;
  var parentViewHeight = $parentView.outerHeight();
  var parentViewWidth = $parentView.outerWidth();
  var posX = params.posX;
  var posY = params.posY;
  var offsetX = params.offsetX || 0;
  var offsetY = params.offsetY || 0;
  var elementWidth = params.elementWidth || MIN_WIDTH;
  var elementHeight = params.elementHeight || MIN_HEIGHT;
  var cssProps = DEFAULT_VALUES;

  if ((posX - elementWidth) > MIN_GAP) {
    cssProps.left = 'auto';
    cssProps.right = (parentViewWidth - posX + offsetX) + 'px';
  } else if ((posX + elementWidth) > elementWidth) {
    cssProps.right = 'auto';
    cssProps.left = (posX + offsetX) + 'px';
  }

  if ((posY + elementHeight) < parentViewHeight) {
    cssProps.bottom = 'auto';
    cssProps.top = (posY + offsetY) + 'px';
  } else if ((posY + elementHeight) > parentViewHeight) {
    cssProps.top = 'auto';
    cssProps.bottom = (parentViewHeight - posY + offsetY) + 'px';
  }

  return cssProps;
};

module.exports = MagicPositioner;
