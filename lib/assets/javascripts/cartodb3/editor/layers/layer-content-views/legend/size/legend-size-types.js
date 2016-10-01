module.exports = [
  {
    value: 'none',
    legendIcon: require('../carousel-icons/none.tpl'),
    label: _t('editor.legend.types.none')
  }, {
    value: 'bubble',
    legendIcon: require('../carousel-icons/bubble.tpl'),
    label: _t('editor.legend.types.bubble'),
    isStyleCompatible: function (styleModel) {
      var fill = styleModel.get('fill');
      var size;
      if (!fill) return false;

      size = fill.size;
      return size && size.attribute !== undefined;
    }
  }
];
