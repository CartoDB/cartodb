var LegendTypes = require('builder/editor/layers/layer-content-views/legend/legend-types');
var styleHelper = require('builder/helpers/style');

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
      var color = styleHelper.getColor(styleModel);

      if (color == null || styleModel.isAnimation()) return false;

      var usesCategory = (color && color.quantification === 'category');
      var hasStringAttribute = (color && color.attribute &&
        color.attribute_type && color.attribute_type === 'string');
      var hasBooleanAttribute = (color && color.attribute &&
        color.attribute_type && color.attribute_type === 'boolean');

      return (usesCategory || hasStringAttribute || hasBooleanAttribute);
    }
  }, {
    value: LegendTypes.TORQUE,
    tooltipTranslationKey: 'editor.legend.tooltips.style.torque',
    legendIcon: require('builder/editor/layers/layer-content-views/legend/carousel-icons/category.tpl'),
    label: _t('editor.legend.types.category'),
    isStyleCompatible: function (styleModel) {
      var color = styleHelper.getColor(styleModel);

      if (color == null || !styleModel.isAnimation()) return false;

      var usesCategory = (color && color.quantification === 'category');
      var hasStringAttribute = (color && color.attribute &&
        color.attribute_type && color.attribute_type === 'string');

      return (usesCategory || hasStringAttribute);
    }
  }, {
    value: LegendTypes.CHOROPLETH,
    tooltipTranslationKey: 'editor.legend.tooltips.style.choropleth',
    legendIcon: require('builder/editor/layers/layer-content-views/legend/carousel-icons/gradient.tpl'),
    label: _t('editor.legend.types.gradient'),
    isStyleCompatible: function (styleModel) {
      var color = styleHelper.getColor(styleModel);
      if (color == null) return false;

      if (styleModel.isAnimation() || styleModel.isHeatmap()) return false;

      var usesCategory = (color && color.quantification === 'category');
      if (usesCategory) return false;

      var attributeTypeIsBoolean = (color.attribute_type && color.attribute_type === 'boolean');
      if (attributeTypeIsBoolean) return false;

      var hasAttribute = color && color.attribute;
      var attributeTypeIsUndef = (color.attribute_type === undefined);
      var attributeTypeIsNotString = (color.attribute_type && color.attribute_type !== 'string');

      return hasAttribute && (attributeTypeIsUndef || attributeTypeIsNotString);
    }
  }, {
    value: LegendTypes.CUSTOM_CHOROPLETH,
    tooltipTranslationKey: 'editor.legend.tooltips.style.custom_choropleth',
    legendIcon: require('builder/editor/layers/layer-content-views/legend/carousel-icons/gradient.tpl'),
    label: _t('editor.legend.types.gradient'),
    isStyleCompatible: function (styleModel) {
      var color = styleHelper.getColor(styleModel);

      if (color == null || !styleModel.isHeatmap()) return false;

      var hasAttribute = color && color.attribute;
      var attributeTypeIsUndef = (color.attribute_type === undefined);
      var attributeTypeIsNotString = (color.attribute_type && color.attribute_type !== 'string');

      return hasAttribute && (attributeTypeIsUndef || attributeTypeIsNotString);
    }
  }, {
    value: LegendTypes.CUSTOM,
    tooltipTranslationKey: 'editor.legend.tooltips.style.custom',
    legendIcon: require('builder/editor/layers/layer-content-views/legend/carousel-icons/custom.tpl'),
    label: _t('editor.legend.types.custom')
  }
];
