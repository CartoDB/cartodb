module.exports = {
  type: 'line-to-layer-all-to-all',
  label: _t('editor.layers.analysis-form.line-to-layer-all-to-all'),

  parametersDataFields: 'source_column,target,target_column,mode,units,closest',

  parse: function (nodeAttrs) {
    return {
      type: 'line-to-layer-all-to-all'
    };
  },

  formatAttrs: function (formAttrs, columnOptions) {
    return formAttrs;
  }
};
