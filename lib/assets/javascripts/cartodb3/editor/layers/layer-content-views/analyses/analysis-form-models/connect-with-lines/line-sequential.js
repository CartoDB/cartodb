var _ = require('underscore');

module.exports = {
  type: 'line-sequential',
  label: _t('editor.layers.analysis-form.line-sequential'),
  parametersDataFields: 'source,type',
  parametersDataSchema: 'order,order_column,order_type',

  parse: function (nodeAttrs) {
    return {
      type: 'line-sequential',
      order: !!nodeAttrs.order_column,
      order_column: nodeAttrs.order_column,
      order_type: nodeAttrs.order_type
    };
  },

  formatAttrs: function (formAttrs, columnOptions) {
    if (!formAttrs.order) {
      formAttrs = _.omit(formAttrs, ['order_column', 'order_type']);
    }
    formAttrs = _.omit(formAttrs, 'order');
    return formAttrs;
  }
};
