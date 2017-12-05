/**
 *  Function for generating necessary CartoCSS blending
 *
 */

module.exports = function (blendingValue, geometryType, styleType) {
  var css = {};
  var property = geometryType + '-comp-op';

  if (blendingValue !== 'none' && blendingValue !== undefined && styleType !== 'heatmap') {
    if (styleType === 'simple') {
      property = 'comp-op';
    }
    css[property] = blendingValue;
  }
  return css;
};
