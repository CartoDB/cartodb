module.exports = {
  type: 'concave-hull',
  label: _t('editor.layers.analysis-form.concave-hull'),
  parametersDataFields: 'type,target_percent,allow_holes,category_column',

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
      type: 'concave-hull',
      aggregate: aggregate
    };
  },
  formatAttrs: function (formAttrs) {
    return formAttrs;
  }
};

