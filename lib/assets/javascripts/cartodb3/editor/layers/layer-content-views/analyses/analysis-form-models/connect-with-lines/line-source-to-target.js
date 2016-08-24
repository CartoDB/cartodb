module.exports = {
  type: 'line-source-to-target',
  label: _t('editor.layers.analysis-form.line-source-to-target'),

  parametersDataFields: 'source,type,target,closest',
  parametersDataSchema: 'target,closest,order,source_column,target_column',

  parse: function (nodeAttrs) {
    return {
      type: 'line-source-to-target',
      target: nodeAttrs.target,
      closest: nodeAttrs.closest,
      order: nodeAttrs.source_column,
      target_column: nodeAttrs.target_column
    };
  },

  formatAttrs: function (formAttrs, columnOptions) {
    return formAttrs;
  }
};
