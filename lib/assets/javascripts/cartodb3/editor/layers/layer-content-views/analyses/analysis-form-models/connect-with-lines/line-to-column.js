module.exports = {
  type: 'line-to-column',
  label: _t('editor.layers.analysis-form.line-to-column'),

  parametersDataFields: 'mode,column_target',

  parse: function (nodeAttrs) {
    return {
      type: 'line-to-column'
    };
  },

  formatAttrs: function (formAttrs, columnOptions) {
    return formAttrs;
  }
};
