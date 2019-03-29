var _ = require('underscore');

module.exports = {
  type: 'bounding-circle',
  label: _t('editor.layers.analysis-form.bounding-circle'),
  parametersDataFields: 'source,type,category_column',

  parse: function (nodeAttrs) {
    if (!nodeAttrs.aggregation_column) {
      nodeAttrs.aggregation_column = 'cartodb_id';
    }
    if (!nodeAttrs.aggregation) {
      nodeAttrs.aggregation = 'count';
    }
    var aggregate = {
      operator: nodeAttrs.aggregation,
      attribute: nodeAttrs.aggregation === 'count' ? '' : nodeAttrs.aggregation_column
    };
    return {
      type: 'bounding-circle',
      category_column: nodeAttrs.category_column,
      aggregate: aggregate
    };
  },

  formatAttrs: function (formAttrs) {
    formAttrs = _.omit(formAttrs, 'aggregate');

    if (!formAttrs.aggregation_column) {
      formAttrs = _.omit(formAttrs, 'aggregation_column');
    }

    if (!formAttrs.category_column) {
      formAttrs = _.omit(formAttrs, 'category_column');
    }

    return formAttrs;
  }
};
