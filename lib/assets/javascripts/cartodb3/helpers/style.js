var _ = require('underscore');
var LegendColorHelper = require('../editor/layers/layer-content-views/legend/form/legend-color-helper');

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
  },

  getStyleCategories: function (styleModel) {
    var color = this.getColor(styleModel);
    var range = 0;
    var items = [];

    if (color.range) {
      range = color.range.length;

      items = _.range(range).map(function (v, index) {
        return {
          color: color.range[index],
          title: color.domain && LegendColorHelper.unquoteColor(color.domain[index]) || _t('editor.legend.legend-form.others'),
          icon: color.images && color.images[index] || ''
        };
      });
    } else if (color.fixed) {
      items = [{
        color: color.fixed,
        icon: color.image,
        title: ''
      }];
    }

    return items;
  }
};
