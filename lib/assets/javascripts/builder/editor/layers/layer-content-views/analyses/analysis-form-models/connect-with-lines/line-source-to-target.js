var _ = require('underscore');

module.exports = {
  type: 'line-source-to-target',
  label: _t('editor.layers.analysis-form.line-source-to-target'),
  parametersDataFields: 'source,type,target,closest',
  parametersDataSchema: 'target,closest,group,source_column,target_source_column',

  parse: function (nodeAttrs) {
    return {
      type: 'line-source-to-target',
      target: nodeAttrs.target,
      closest: nodeAttrs.closest,
      source_column: nodeAttrs.source_column,
      group: nodeAttrs.target_column && nodeAttrs.source_column,
      target_source_column: nodeAttrs.target_column
    };
  },

  formatAttrs: function (formAttrs, columnOptions) {
    formAttrs.target_column = formAttrs.target_source_column;

    if (!formAttrs.group) {
      formAttrs = _.omit(formAttrs, ['source_column', 'target_column']);
    }

    formAttrs = _.omit(formAttrs, ['target_source_column', 'group']);
    return formAttrs;
  }
};
