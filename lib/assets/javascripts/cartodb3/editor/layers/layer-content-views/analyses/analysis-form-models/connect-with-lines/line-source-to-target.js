module.exports = {
  type: 'line-source-to-target',
  label: _t('editor.layers.analysis-form.line-source-to-target'),

  parametersDataFields: 'source_column,target,target_column,mode,closest',

  parse: function (nodeAttrs) {
    return {
      type: 'line-source-to-target'
    };
  },

  formatAttrs: function (formAttrs, columnOptions) {
    return formAttrs;
  }
};
