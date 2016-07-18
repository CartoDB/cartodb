module.exports = {
  type: 'georeference-postal-code',
  label: _t('editor.layers.analysis-form.georeference-postal-code'),
  fieldAttrs: {
    postal_code_column: {
      showSearch: true
    },
    country: {
      showSearch: true,
      allowFreeTextInput: true
    }
  },

  validatorFor: {
    city_column: ['required']
  },

  parametersDataFields: 'postal_code_column,country',

  parse: function (nodeAttrs) {
    return {
      type: 'georeference-postal-code',
      postal_code_column: nodeAttrs.postal_code_column,
      country: nodeAttrs.country || nodeAttrs.country_column
    };
  },

  formatAttrs: function (formAttrs, columnOptions) {
    if (formAttrs.country && columnOptions.findColumn(formAttrs.country, 'string')) {
      formAttrs.country_column = formAttrs.country;
      delete formAttrs.country;
    } else {
      delete formAttrs.country_column;
    }
    return formAttrs;
  }
};
