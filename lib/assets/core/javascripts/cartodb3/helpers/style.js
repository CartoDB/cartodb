var _ = require('underscore');

module.exports = {
  getStyleAttrs: function (styleModel) {
    if (!styleModel) return;

    var fill = styleModel.get('fill');
    var stroke = styleModel.get('stroke');
    if (!fill && !stroke || _.isEmpty(fill) && _.isEmpty(stroke)) return;

    return {
      fill: fill,
      stroke: stroke
    };
  },

  getColorAttribute: function (styleModel) {
    var color = this.getColor(styleModel);
    return color && color.attribute;
  },

  getSizeAttribute: function (styleModel) {
    var size = this.getSize(styleModel);
    return size && size.attribute;
  },

  getColor: function (styleModel) {
    var style = this.getStyleAttrs(styleModel);
    var color = style ? (style.fill && style.fill.color || style.stroke && style.stroke.color) : null;
    return color;
  },

  getSize: function (styleModel) {
    var style = this.getStyleAttrs(styleModel);
    var size = style ? (style.fill && style.fill.size || style.stroke && style.stroke.size) : null;
    return size;
  }
};
