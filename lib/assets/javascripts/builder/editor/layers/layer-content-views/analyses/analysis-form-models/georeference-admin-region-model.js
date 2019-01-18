module.exports = {
  type: 'georeference-admin-region',
  label: _t('editor.layers.analysis-form.georeference.admin-region'),
  fieldAttrs: {
    admin_region_column: {
      showSearch: true
    },
    country: {
      showSearch: true,
      allowFreeTextInput: true
    }
  },

  validatorFor: {
    admin_region_column: ['required']
  },

  parametersDataFields: 'admin_region_column,country',

  getParameters: function () {
    var params = this.parametersDataFields;

    return params;
  },

  parse: function (nodeAttrs) {
    return {
      type: 'georeference-admin-region',
      admin_region_column: nodeAttrs.admin_region_column,
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
