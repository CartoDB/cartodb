/**
 *  Image-filter CartoCSS generation for heatmap layers
 */

module.exports = function (props) {
  var css = {};
  if (props.ramp) {
    css['image-filters'] = 'colorize-alpha(' + props.ramp.join(',') + ')';
  }
  return css;
};
