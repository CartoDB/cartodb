module.exports = {
  type: 'line-sequential',
  label: _t('editor.layers.analysis-form.line-sequential'),

  parametersDataFields: 'source,type',
  parametersDataSchema: 'order,order_column,order_type',

  parse: function (nodeAttrs) {
    var order = true;

    if (!nodeAttrs.order_column) {
      order = false;
    }

    return {
      type: 'line-sequential',
      order: order,
      order_column: nodeAttrs.order_column,
      order_type: nodeAttrs.order_type
    };
  },

  formatAttrs: function (formAttrs, columnOptions) {
    return formAttrs;
  }
};
