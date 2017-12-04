var Utils = require('../../../helpers/utils');
var StyleUtils = require('./style-generation-utils');

module.exports = function (labelsObj) {
  var css = {};
  if (StyleUtils.isStyleAttributeValid(labelsObj.attribute)) {
    css['text-name'] = '[' + labelsObj.attribute + ']';
    css['text-face-name'] = "'" + labelsObj.font + "'";
    if (labelsObj.fill) {
      css['text-size'] = labelsObj.fill.size.fixed;

      if (labelsObj.fill.color.opacity != null && labelsObj.fill.color.opacity < 1) {
        css['text-fill'] = Utils.hexToRGBA(labelsObj.fill.color.fixed, labelsObj.fill.color.opacity);
      } else {
        css['text-fill'] = labelsObj.fill.color.fixed;
      }
    }
    css['text-label-position-tolerance'] = 0;
    if (labelsObj.halo) {
      css['text-halo-radius'] = labelsObj.halo.size.fixed;

      if (labelsObj.halo.color.opacity != null && labelsObj.halo.color.opacity < 1) {
        css['text-halo-fill'] = Utils.hexToRGBA(labelsObj.halo.color.fixed, labelsObj.halo.color.opacity);
      } else {
        css['text-halo-fill'] = labelsObj.halo.color.fixed;
      }
    }
    css['text-dy'] = labelsObj.offset === undefined ? -10 : labelsObj.offset;
    css['text-allow-overlap'] = labelsObj.overlap === undefined ? true : labelsObj.overlap;
    css['text-placement'] = labelsObj.placement;
    css['text-placement-type'] = 'dummy';
  }
  return css;
};
