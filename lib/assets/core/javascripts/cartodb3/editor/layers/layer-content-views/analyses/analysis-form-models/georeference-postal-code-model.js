module.exports = {
  type: 'georeference-postal-code',
  label: _t('editor.layers.analysis-form.georeference.postal-code'),
  fieldAttrs: {
    postal_code_column: {
      showSearch: true
    },
    country_column: {
      showSearch: true,
      allowFreeTextInput: true
    }
  },

  validatorFor: {
    city_column: ['required'],
    country_column: ['required']
  },

  parametersDataFields: 'postal_code_column,country_column',

  getParameters: function () {
    var params = this.parametersDataFields;

    return params;
  },

  parse: function (nodeAttrs) {
    return {
      type: 'georeference-postal-code',
      postal_code_column: nodeAttrs.postal_code_column,
      country_column: nodeAttrs.country || nodeAttrs.country_column
    };
  },

  formatAttrs: function (formAttrs, columnOptions) {
    if (columnOptions.findColumn(formAttrs.country_column)) {
      delete formAttrs.country;
    } else {
      formAttrs.country = formAttrs.country_column;
      delete formAttrs.country_column;
    }
    return formAttrs;
  }
};
