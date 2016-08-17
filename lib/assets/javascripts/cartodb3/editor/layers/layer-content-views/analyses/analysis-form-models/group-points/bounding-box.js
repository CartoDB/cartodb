module.exports = {
  type: 'bounding-box',
  label: _t('editor.layers.analysis-form.bounding-box'),
  parametersDataFields: 'category_column',

  fieldAttrs: {
  },

  validatorFor: {
  },

  parse: function (nodeAttrs) {
    return {
      type: 'bounding-box'
    };
  },

  formatAttrs: function (formAttrs) {
    return formAttrs;
  }
};

