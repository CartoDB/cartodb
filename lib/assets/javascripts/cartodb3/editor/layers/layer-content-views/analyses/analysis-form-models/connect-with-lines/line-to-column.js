module.exports = {
  type: 'line-to-column',
  label: _t('editor.layers.analysis-form.line-to-column'),

  parametersDataFields: 'source,type,target_column',
  parametersDataSchema: 'target_column',

  parse: function (nodeAttrs) {
    return {
      type: 'line-to-column'
    };
  },

  formatAttrs: function (formAttrs, columnOptions) {
    return formAttrs;
  }
};
