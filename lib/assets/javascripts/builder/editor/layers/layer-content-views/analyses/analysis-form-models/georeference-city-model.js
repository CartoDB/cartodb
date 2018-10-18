var _ = require('underscore');

module.exports = {
  type: 'georeference-city',
  label: _t('editor.layers.analysis-form.georeference.city'),
  fieldAttrs: {
    city_column: {
      showSearch: true
    },
    admin_region: {
      showSearch: true,
      allowFreeTextInput: true
    },
    country: {
      showSearch: true,
      allowFreeTextInput: true
    }
  },

  validatorFor: {
    city_column: ['required']
  },

  parametersDataFields: 'city_column,admin_region,country',

  getParameters: function () {
    var params = this.parametersDataFields;

    return params;
  },

  parse: function (nodeAttrs) {
    return {
      type: 'georeference-city',
      city_column: nodeAttrs.city_column,
      admin_region: nodeAttrs.admin_region || nodeAttrs.admin_region_column,
      country: nodeAttrs.country || nodeAttrs.country_column
    };
  },

  formatAttrs: function (formAttrs, columnOptions) {
    _.each(['country', 'admin_region'], function (attr) {
      if (formAttrs[attr] && columnOptions.findColumn(formAttrs[attr], 'string')) {
        formAttrs[attr + '_column'] = formAttrs[attr];
        delete formAttrs[attr];
      } else {
        delete formAttrs[attr + '_column'];
      }
    }, this);

    return formAttrs;
  }
};
