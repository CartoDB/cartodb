module.exports = {
  type: 'line-source-to-target',
  label: _t('editor.layers.analysis-form.line-source-to-target'),

  parametersDataFields: 'source,type,target,closest',
  parametersDataSchema: 'target,closest,order,source_column,target_column',

  parse: function (nodeAttrs) {
    return {
      type: 'line-source-to-target'
    };
  },

  formatAttrs: function (formAttrs, columnOptions) {
    return formAttrs;
  }
};
