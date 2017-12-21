module.exports = {
  type: 'georeference-postal-code',
  label: _t('editor.layers.analysis-form.georeference.postal-code'),
  fieldAttrs: {
    postal_code_column: {
      showSearch: true
    },
    postal_code_country: {
      showSearch: true,
      allowFreeTextInput: true
    }
  },

  validatorFor: {
    postal_code_column: ['required'],
    postal_code_country: ['required']
  },

  parametersDataFields: 'postal_code_column,postal_code_country',

  getParameters: function () {
    var params = this.parametersDataFields;

    return params;
  },

  parse: function (nodeAttrs) {
    return {
      type: 'georeference-postal-code',
      postal_code_column: nodeAttrs.postal_code_column || '',
      postal_code_country: nodeAttrs.postal_code_country || nodeAttrs.country_column || ''
    };
  },

  formatAttrs: function (formAttrs, columnOptions) {
    if (formAttrs.postal_code_country && columnOptions.findColumn(formAttrs.postal_code_country, 'string')) {
      formAttrs.country_column = formAttrs.postal_code_country;
      delete formAttrs.postal_code_country;
    } else {
      formAttrs.country = formAttrs.postal_code_country;
      delete formAttrs.country_column;
    }
    return formAttrs;
  }
};
