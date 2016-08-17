module.exports = {
  type: 'bounding-circle',
  label: _t('editor.layers.analysis-form.bounding-circle'),
  parametersDataFields: 'category_column',

  fieldAttrs: {
  },

  validatorFor: {
  },

  parse: function (nodeAttrs) {
    return {
      type: 'bounding-circle'
    };
  },

  formatAttrs: function (formAttrs) {
    return formAttrs;
  }
};

