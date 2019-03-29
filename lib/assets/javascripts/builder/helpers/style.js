var _ = require('underscore');
var ParserCSS = require('builder/helpers/parser-css');
var LegendColorHelper = require('builder/editor/layers/layer-content-views/legend/form/legend-color-helper');

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

  getColorsFromRange: function (styleModel) {
    var color = this.getColor(styleModel);
    if (!(color && color.range)) { return []; }

    return color.range.map(function (v, index) {
      return { color: v };
    });
  },

  getHeatmapColors: function (layerDefinitionModel) {
    var changed = layerDefinitionModel.styleModel && layerDefinitionModel.styleModel.hasChanged();

    if (changed) {
      return this.getColorsFromRange(layerDefinitionModel.styleModel);
    }

    var content = layerDefinitionModel.cartocssModel.get('content');
    var parser = new ParserCSS(content);
    return parser.colorsUsedForLegend({ mode: 'hex' });
  },

  getStyleCategories: function (styleModel) {
    var color = this.getColor(styleModel);
    if (!color) { return []; }

    if (color.range) {
      return color.range.map(function (v, index) {
        return {
          color: v,
          title: color.domain && LegendColorHelper.unquoteColor(color.domain[index]) || _t('editor.legend.legend-form.others'),
          icon: color.images && color.images[index] || ''
        };
      });
    }

    if (color.fixed) {
      return [{
        color: color.fixed,
        icon: color.image || '',
        title: ''
      }];
    }

    return [];
  }
};
