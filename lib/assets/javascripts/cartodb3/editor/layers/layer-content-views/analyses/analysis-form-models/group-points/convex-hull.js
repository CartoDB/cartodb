module.exports = {
  type: 'convex-hull',
  label: _t('editor.layers.analysis-form.convex-hull'),
  parametersDataFields: 'type,category_column',

  fieldAttrs: {
  },

  validatorFor: {
  },

  parse: function (nodeAttrs) {
    if (!nodeAttrs.aggregate_column) {
      nodeAttrs.aggregate_column = 'cartodb_id';
    }
    if (!nodeAttrs.aggregate_function) {
      nodeAttrs.aggregate_function = 'count';
    }
    var aggregate = {
      operator: nodeAttrs.aggregate_function,
      attribute: nodeAttrs.aggregate_function === 'count' ? '' : nodeAttrs.aggregate_column
    };
    return {
      type: 'convex-hull',
      aggregate: aggregate
    };
  },

  formatAttrs: function (formAttrs) {
    return formAttrs;
  }
};

