var _ = require('underscore');

module.exports = [
  {
    value: 'none',
    legendIcon: require('../carousel-icons/none.tpl'),
    label: _t('editor.legend.types.none')
  }, {
    value: 'category',
    legendIcon: require('../carousel-icons/category.tpl'),
    label: _t('editor.legend.types.category'),
    isStyleCompatible: function (styleModel) {
      var fill = styleModel.get('fill');
      var stroke = styleModel.get('stroke');
      var color;

      if (!fill && !stroke || _.isEmpty(fill) && _.isEmpty(stroke)) return false;

      color = fill && fill.color || stroke && stroke.color;
      return color && color.attribute && color.attribute_type && color.attribute_type === 'string';
    }
  }, {
    value: 'choropleth',
    legendIcon: require('../carousel-icons/gradient.tpl'),
    label: _t('editor.legend.types.gradient'),
    isStyleCompatible: function (styleModel) {
      var fill = styleModel.get('fill');
      var stroke = styleModel.get('stroke');
      var color;

      if (!fill && !stroke || _.isEmpty(fill) && _.isEmpty(stroke)) return false;

      color = fill && fill.color || stroke && stroke.color;
      return color && color.attribute && (color.attribute_type === undefined || color.attribute_type && color.attribute_type !== 'string');
    }
  }, {
    value: 'custom',
    legendIcon: require('../carousel-icons/custom.tpl'),
    label: _t('editor.legend.types.custom')
  }
];
