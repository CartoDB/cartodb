module.exports = [
  {
    value: 'none',
    legendIcon: require('../carousel-icons/none.tpl'),
    label: _t('editor.legend.types.none')
  }, {
    value: 'category',
    legendIcon: require('../carousel-icons/category.tpl'),
    label: _t('editor.legend.types.category')
  }, {
    value: 'choropleth',
    legendIcon: require('../carousel-icons/gradient.tpl'),
    label: _t('editor.legend.types.gradient')
  }, {
    value: 'custom',
    legendIcon: require('../carousel-icons/custom.tpl'),
    label: _t('editor.legend.types.custom')
  }
];
