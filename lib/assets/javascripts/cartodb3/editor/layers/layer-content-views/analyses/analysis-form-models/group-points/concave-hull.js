var _ = require('underscore');

module.exports = {
  type: 'concave-hull',
  label: _t('editor.layers.analysis-form.concave-hull'),
  parametersDataFields: 'source,type,target_percent,allow_holes,category_column',

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
      type: 'concave-hull',
      aggregate: aggregate
    };
  },

  formatAttrs: function (formAttrs) {
    formAttrs = _.omit(formAttrs, 'aggregate');

    if (!formAttrs.aggregation_column) {
      formAttrs = _.omit(formAttrs, 'aggregation_column');
    }

    if (!formAttrs.allow_holes) {
      formAttrs = _.omit(formAttrs, 'allow_holes');
    }

    if (!formAttrs.category_column) {
      formAttrs = _.omit(formAttrs, 'category_column');
    }

    return formAttrs;
  }
};

