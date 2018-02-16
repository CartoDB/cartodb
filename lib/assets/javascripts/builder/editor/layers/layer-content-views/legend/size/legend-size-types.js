var _ = require('underscore');

module.exports = [
  {
    value: 'none',
    tooltipTranslationKey: 'editor.legend.tooltips.style.none',
    legendIcon: require('builder/editor/layers/layer-content-views/legend/carousel-icons/none.tpl'),
    label: _t('editor.legend.types.none')
  }, {
    value: 'bubble',
    tooltipTranslationKey: 'editor.legend.tooltips.style.bubble',
    legendIcon: require('builder/editor/layers/layer-content-views/legend/carousel-icons/bubble.tpl'),
    label: _t('editor.legend.types.bubble'),
    isStyleCompatible: function (styleModel) {
      var fill = styleModel.get('fill');
      var stroke = styleModel.get('stroke');
      var size;

      if (!fill && !stroke || _.isEmpty(fill) && _.isEmpty(stroke)) return false;

      size = fill && fill.size || stroke && stroke.size;
      return size && size.attribute !== undefined;
    }
  }
];
