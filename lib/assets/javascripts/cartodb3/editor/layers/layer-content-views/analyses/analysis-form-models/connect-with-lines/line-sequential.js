module.exports = {
  type: 'line-sequential',
  label: _t('editor.layers.analysis-form.line-sequential'),

  parametersDataFields: 'mode,column_target,units,order_column,order_type',

  parse: function (nodeAttrs) {
    return {
      type: 'line-sequential'
    };
  },

  formatAttrs: function (formAttrs, columnOptions) {
    return formAttrs;
  }
};
