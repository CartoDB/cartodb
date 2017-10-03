var _ = require('underscore');

var noOp = function () {
  return true;
};

var getStyleAttrs = function (styleModel) {
  var fill = styleModel.get('fill');
  var stroke = styleModel.get('stroke');
  if (!fill && !stroke || _.isEmpty(fill) && _.isEmpty(stroke)) return false;

  return {
    fill: fill,
    stroke: stroke
  };
};

var validateColorRange = function (styleModel) {
  var attributes = getStyleAttrs(styleModel);
  if (!attributes) return false;

  var color = attributes.fill && attributes.fill.color || attributes.stroke && attributes.stroke.color;
  return color.range && color.range.length > 0;
};

var validateSizeRange = function (styleModel) {
  var attributes = getStyleAttrs(styleModel);
  if (!attributes) return false;

  var size = attributes.fill && attributes.fill.size || attributes.stroke && attributes.stroke.size;
  return size.range && size.range.length > 0;
};

var validateRangeAndDomain = function (styleModel) {
  var attributes = getStyleAttrs(styleModel);
  if (!attributes) return false;

  var color = attributes.fill && attributes.fill.color || attributes.stroke && attributes.stroke.color;
  return color.range && color.range.length > 0 && color.domain && color.domain.length > 0 && color.range && color.range.length > 0;
};

var validations = {
  bubble: validateSizeRange,
  category: validateRangeAndDomain,
  torque: validateRangeAndDomain,
  choropleth: validateColorRange,
  custom_choropleth: validateColorRange,
  custom: noOp
};

module.exports = validations;
