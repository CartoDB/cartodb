/**
 *  Helper functions for the style generation
 *
 */

module.exports = {
  isTypeTorque: function (styleType) {
    return styleType === 'animation' || styleType === 'heatmap';
  },

  isCategoryType: function (styleDef, geometryType) {
    if (!styleDef || !geometryType) {
      return false;
    }

    if (geometryType === 'line') {
      var stroke = styleDef.stroke;
      return stroke && stroke.color && stroke.color.fixed == null;
    } else {
      var fill = styleDef.fill;
      return fill && fill.color && fill.color.fixed == null;
    }
  },

  hasImagesSelected: function (images) {
    if (!images) return false;
    if (!_.isArray(images)) return false;

    return _.some(images, function (image) {
      return image !== '';
    });
  },

  isLabelsEnabled: function (styleDef) {
    return styleDef.labels && styleDef.labels.enabled && !!styleDef.labels.enabled;
  }
};
