module.exports = {
  type: 'georeference-country',
  label: _t('editor.layers.analysis-form.georeference.country'),
  fieldAttrs: {
    country_column: {
      showSearch: true
    }
  },

  validatorFor: {
    country_column: ['required']
  },

  parametersDataFields: 'country_column',

  getParameters: function () {
    var params = this.parametersDataFields;

    return params;
  },

  parse: function (nodeAttrs) {
    return {
      type: 'georeference-country',
      country_column: nodeAttrs.country_column || nodeAttrs.country
    };
  },

  formatAttrs: function (formAttrs) {
    return formAttrs;
  }
};
