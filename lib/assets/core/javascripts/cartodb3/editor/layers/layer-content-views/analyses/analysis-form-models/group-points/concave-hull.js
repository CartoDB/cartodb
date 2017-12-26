var _ = require('underscore');

module.exports = {
  type: 'concave-hull',
  label: _t('editor.layers.analysis-form.concave-hull'),
  parametersDataFields: 'source,type,target_percentage,allow_holes,category_column',

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

    var target_percentage = 70;

    if (nodeAttrs.target_percent === 0) {
      target_percentage = 0;
    } else if (nodeAttrs.target_percent) {
      target_percentage = nodeAttrs.target_percent * 100;
    }

    return {
      type: 'concave-hull',
      target_percentage: target_percentage,
      category_column: nodeAttrs.category_column,
      aggregate: aggregate
    };
  },

  formatAttrs: function (formAttrs) {
    formAttrs = _.omit(formAttrs, 'aggregate');

    formAttrs.target_percent = formAttrs.target_percentage / 100;
    formAttrs = _.omit(formAttrs, 'target_percentage');

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
