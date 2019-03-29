var LegendTypes = require('builder/editor/layers/layer-content-views/legend/legend-types');
var styleHelper = require('builder/helpers/style');

module.exports = [
  {
    value: LegendTypes.NONE,
    tooltipTranslationKey: 'editor.legend.tooltips.style.none',
    legendIcon: require('builder/editor/layers/layer-content-views/legend/carousel-icons/none.tpl'),
    label: _t('editor.legend.types.none')
  }, {
    value: LegendTypes.BUBBLE,
    tooltipTranslationKey: 'editor.legend.tooltips.style.bubble',
    legendIcon: require('builder/editor/layers/layer-content-views/legend/carousel-icons/bubble.tpl'),
    label: _t('editor.legend.types.bubble'),
    isStyleCompatible: function (styleModel) {
      var size = styleHelper.getSize(styleModel);
      if (size == null) return false;

      return size && size.attribute !== undefined;
    }
  }
];
