/**
 *  Helper functions for the style generation
 *
 */

module.exports = {
  isTypeTorque: function (type) {
    return !!type && (type === 'animation' || type === 'heatmap');
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
  }
};
