var _ = require('underscore');

module.exports = {
  type: 'line-source-to-target',
  label: _t('editor.layers.analysis-form.line-source-to-target'),

  parametersDataFields: 'source,type,target,closest',
  parametersDataSchema: 'target,closest,order,source_column,target_source_column',

  parse: function (nodeAttrs) {
    return {
      type: 'line-source-to-target',
      target: nodeAttrs.target,
      closest: nodeAttrs.closest,
      source_column: nodeAttrs.source_column,
      order: nodeAttrs.target_column && nodeAttrs.source_column,
      target_source_column: nodeAttrs.target_column
    };
  },

  formatAttrs: function (formAttrs, columnOptions) {
    formAttrs.target_source = formAttrs.target_source_column;
    formAttrs = _.omit(formAttrs, ['target_source_column', 'order']);
    return formAttrs;
  }
};
