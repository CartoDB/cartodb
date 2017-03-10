var _ = require('underscore');

module.exports = {
  type: 'line-sequential',
  label: _t('editor.layers.analysis-form.line-sequential'),
  parametersDataFields: 'source,type,order_column,order_type',
  parametersDataSchema: 'order_column,order_type,category_column',

  parse: function (nodeAttrs) {
    return {
      type: 'line-sequential',
      order_column: nodeAttrs.order_column,
      category_column: nodeAttrs.category_column,
      order_type: nodeAttrs.order_type
    };
  },

  formatAttrs: function (formAttrs, columnOptions) {
    if (!formAttrs.category_column) {
      formAttrs = _.omit(formAttrs, 'category_column');
    }
    return formAttrs;
  }
};
