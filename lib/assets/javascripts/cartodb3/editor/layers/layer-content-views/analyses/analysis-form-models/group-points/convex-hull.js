module.exports = {
  type: 'convex-hull',
  label: _t('editor.layers.analysis-form.convex-hull'),
  parametersDataFields: 'type,category_column',

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
      type: 'convex-hull',
      aggregate: aggregate
    };
  },

  formatAttrs: function (formAttrs) {
    delete formAttrs.aggregate;
    delete formAttrs.target_percent;

    if (!formAttrs.aggregation_column) {
      delete formAttrs.aggregation_column;
    }

    if (!formAttrs.category_column) {
      delete formAttrs.category_column;
    }

    return formAttrs;
  }
};
