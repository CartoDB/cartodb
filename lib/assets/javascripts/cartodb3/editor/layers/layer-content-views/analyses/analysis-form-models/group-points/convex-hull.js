module.exports = {
  type: 'convex-hull',
  label: _t('editor.layers.analysis-form.convex-hull'),
  parametersDataFields: 'type,category_column',

  fieldAttrs: {
  },

  validatorFor: {
  },

  parse: function (nodeAttrs) {
    return {
      type: 'convex-hull'
    };
  },

  formatAttrs: function (formAttrs) {
    return formAttrs;
  }
};

