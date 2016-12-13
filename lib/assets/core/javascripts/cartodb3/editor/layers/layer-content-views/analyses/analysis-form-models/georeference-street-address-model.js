var _ = require('underscore');

module.exports = {
  type: 'georeference-street-address',
  label: _t('editor.layers.analysis-form.georeference-street-address'),
  fieldAttrs: {
    street_address_column: {
      showSearch: true
    },
    city: {
      showSearch: true,
      allowFreeTextInput: true
    },
    state: {
      showSearch: true,
      allowFreeTextInput: true
    },
    country: {
      showSearch: true,
      allowFreeTextInput: true
    }
  },

  validatorFor: {
    street_address_column: ['required']
  },

  parametersDataFields: 'street_address_column,city,state,country',

  parse: function (nodeAttrs) {
    return {
      type: 'georeference-street-address',
      street_address_column: nodeAttrs.street_address_column,
      city: nodeAttrs.city || nodeAttrs.city_column,
      state: nodeAttrs.state || nodeAttrs.state_column,
      country: nodeAttrs.country || nodeAttrs.country_column
    };
  },

  formatAttrs: function (formAttrs, columnOptions) {
    _.each(['city', 'state', 'country'], function (attr) {
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
