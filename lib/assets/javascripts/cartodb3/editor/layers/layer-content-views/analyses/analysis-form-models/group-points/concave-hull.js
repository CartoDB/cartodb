module.exports = {
  type: 'concave-hull',
  label: _t('editor.layers.analysis-form.concave-hull'),
  parametersDataFields: 'category_column',

  fieldAttrs: {
  },

  validatorFor: {
  },

  parse: function (nodeAttrs) {
    return {
      type: 'concave-hull'
    };
  },

  formatAttrs: function (formAttrs) {
    return formAttrs;
  }
};

