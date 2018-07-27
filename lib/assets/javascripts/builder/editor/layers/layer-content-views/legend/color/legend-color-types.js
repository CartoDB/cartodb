var _ = require('underscore');
var LegendTypes = require('builder/editor/layers/layer-content-views/legend/legend-types');
var styleHelper = require('builder/helpers/style');
var StyleConstants = require('builder/components/form-components/_constants/_style');

module.exports = [
  {
    value: LegendTypes.NONE,
    tooltipTranslationKey: 'editor.legend.tooltips.style.none',
    legendIcon: require('builder/editor/layers/layer-content-views/legend/carousel-icons/none.tpl'),
    label: _t('editor.legend.types.none')
  }, {
    value: LegendTypes.CATEGORY,
    tooltipTranslationKey: 'editor.legend.tooltips.style.category',
    legendIcon: require('builder/editor/layers/layer-content-views/legend/carousel-icons/category.tpl'),
    label: _t('editor.legend.types.category'),
    isStyleCompatible: function (styleModel) {
      var styleType = styleModel.get('type');
      var color = styleHelper.getColor(styleModel);

      if (color == null) return false;

      return (styleType !== StyleConstants.Type.ANIMATION && (color && color.quantification === 'category' ||
        color && color.attribute && color.attribute_type && color.attribute_type === 'string'));
    }
  }, {
    value: LegendTypes.TORQUE,
    tooltipTranslationKey: 'editor.legend.tooltips.style.torque',
    legendIcon: require('builder/editor/layers/layer-content-views/legend/carousel-icons/category.tpl'),
    label: _t('editor.legend.types.category'),
    isStyleCompatible: function (styleModel) {
      var styleType = styleModel.get('type');
      var color = styleHelper.getColor(styleModel);
      if (color == null) return false;

      return (styleType === StyleConstants.Type.ANIMATION && (color && color.quantification === 'category' ||
        color && color.attribute && color.attribute_type && color.attribute_type === 'string'));
    }
  }, {
    value: LegendTypes.CHOROPLETH,
    tooltipTranslationKey: 'editor.legend.tooltips.style.choropleth',
    legendIcon: require('builder/editor/layers/layer-content-views/legend/carousel-icons/gradient.tpl'),
    label: _t('editor.legend.types.gradient'),
    isStyleCompatible: function (styleModel) {
      var styleType = styleModel.get('type');
      var fill = styleModel.get('fill');
      var stroke = styleModel.get('stroke');
      var color;

      if (styleType === StyleConstants.Type.ANIMATION || styleType === StyleConstants.Type.HEATMAP) return false;
      if (!fill && !stroke || _.isEmpty(fill) && _.isEmpty(stroke)) return false;

      color = fill && fill.color || stroke && stroke.color;

      if (color && color.quantification === 'category') return false;

      return color && color.attribute && (color.attribute_type === undefined || color.attribute_type && color.attribute_type !== 'string');
    }
  }, {
    value: LegendTypes.CUSTOM_CHOROPLETH,
    tooltipTranslationKey: 'editor.legend.tooltips.style.custom_choropleth',
    legendIcon: require('builder/editor/layers/layer-content-views/legend/carousel-icons/gradient.tpl'),
    label: _t('editor.legend.types.gradient'),
    isStyleCompatible: function (styleModel) {
      var styleType = styleModel.get('type');
      var fill = styleModel.get('fill');
      var stroke = styleModel.get('stroke');
      var color;

      if (!fill && !stroke || _.isEmpty(fill) && _.isEmpty(stroke)) return false;

      color = fill && fill.color || stroke && stroke.color;
      return styleType === StyleConstants.Type.HEATMAP && color && color.attribute && (color.attribute_type === undefined || color.attribute_type && color.attribute_type !== 'string');
    }
  }, {
    value: LegendTypes.CUSTOM,
    tooltipTranslationKey: 'editor.legend.tooltips.style.custom',
    legendIcon: require('builder/editor/layers/layer-content-views/legend/carousel-icons/custom.tpl'),
    label: _t('editor.legend.types.custom')
  }
];
