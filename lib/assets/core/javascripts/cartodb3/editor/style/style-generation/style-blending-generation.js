/**
 *  Function for generating necessary CartoCSS blending
 *
 */

module.exports = function (blendingValue, geometryType, animatedType) {
  var css = {};
  var property = geometryType + '-comp-op';
  if (blendingValue !== 'none' && blendingValue !== undefined && animatedType !== 'heatmap') {
    if (animatedType === 'simple') {
      property = 'comp-op';
    }
    css[property] = blendingValue;
  }
  return css;
};
