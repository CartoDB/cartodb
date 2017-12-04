var _ = require('underscore');
var StyleUtils = require('./style-generation-utils');

/**
 *  Function for generating trails CartoCSS
 *
 */

module.exports = function (styleDef) {
  var baseWidth = styleDef.fill.size && parseInt(styleDef.fill.size.fixed, 10);
  var baseOpacity = styleDef.fill.color.opacity != null ? styleDef.fill.color.opacity : 1;
  if (!baseWidth) return '';
  return '\n' +
    _.range(1, parseInt(styleDef.animated.trails, 10) + 1)
      .map(function (t) {
        return '#layer[frame-offset=' + t + '] {\n' +
          StyleUtils.convertObjToCartoCSS({ 'marker-width': baseWidth + 2 * t }, '  ') +
          StyleUtils.convertObjToCartoCSS({ 'marker-fill-opacity': baseOpacity / (2 * t) }, '  ') +
          '}';
      }
      ).join('\n');
}
