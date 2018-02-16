var _ = require('underscore');
var styleHelper = require('builder/helpers/style');

module.exports = [
  {
    value: 'none',
    tooltipTranslationKey: 'editor.legend.tooltips.style.none',
    legendIcon: require('builder/editor/layers/layer-content-views/legend/carousel-icons/none.tpl'),
    label: _t('editor.legend.types.none')
  }, {
    value: 'category',
    tooltipTranslationKey: 'editor.legend.tooltips.style.category',
    legendIcon: require('builder/editor/layers/layer-content-views/legend/carousel-icons/category.tpl'),
    label: _t('editor.legend.types.category'),
    isStyleCompatible: function (styleModel) {
      var type = styleModel.get('type');
      var color = styleHelper.getColor(styleModel);

      if (color == null) return false;

      return (type !== 'animation' && (color && color.quantification === 'category' ||
             color && color.attribute && color.attribute_type && color.attribute_type === 'string'));
    }
  }, {
    value: 'torque',
    tooltipTranslationKey: 'editor.legend.tooltips.style.torque',
    legendIcon: require('builder/editor/layers/layer-content-views/legend/carousel-icons/category.tpl'),
    label: _t('editor.legend.types.category'),
    isStyleCompatible: function (styleModel) {
      var type = styleModel.get('type');
      var color = styleHelper.getColor(styleModel);
      if (color == null) return false;

      return (type === 'animation' && (color && color.quantification === 'category' ||
             color && color.attribute && color.attribute_type && color.attribute_type === 'string'));
    }
  }, {
    value: 'choropleth',
    tooltipTranslationKey: 'editor.legend.tooltips.style.choropleth',
    legendIcon: require('builder/editor/layers/layer-content-views/legend/carousel-icons/gradient.tpl'),
    label: _t('editor.legend.types.gradient'),
    isStyleCompatible: function (styleModel) {
      var type = styleModel.get('type');
      var fill = styleModel.get('fill');
      var stroke = styleModel.get('stroke');
      var color;

      if (type === 'animation' || type === 'heatmap') return false;
      if (!fill && !stroke || _.isEmpty(fill) && _.isEmpty(stroke)) return false;

      color = fill && fill.color || stroke && stroke.color;

      if (color && color.quantification === 'category') return false;

      return color && color.attribute && (color.attribute_type === undefined || color.attribute_type && color.attribute_type !== 'string');
    }
  }, {
    value: 'custom_choropleth',
    tooltipTranslationKey: 'editor.legend.tooltips.style.custom_choropleth',
    legendIcon: require('builder/editor/layers/layer-content-views/legend/carousel-icons/gradient.tpl'),
    label: _t('editor.legend.types.gradient'),
    isStyleCompatible: function (styleModel) {
      var type = styleModel.get('type');
      var fill = styleModel.get('fill');
      var stroke = styleModel.get('stroke');
      var color;

      if (!fill && !stroke || _.isEmpty(fill) && _.isEmpty(stroke)) return false;

      color = fill && fill.color || stroke && stroke.color;
      return type === 'heatmap' && color && color.attribute && (color.attribute_type === undefined || color.attribute_type && color.attribute_type !== 'string');
    }
  }, {
    value: 'custom',
    tooltipTranslationKey: 'editor.legend.tooltips.style.custom',
    legendIcon: require('builder/editor/layers/layer-content-views/legend/carousel-icons/custom.tpl'),
    label: _t('editor.legend.types.custom')
  }
];
