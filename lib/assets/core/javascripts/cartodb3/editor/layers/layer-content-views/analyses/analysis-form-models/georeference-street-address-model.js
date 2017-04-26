var _ = require('underscore');

var PARAMETERS_FOR_CONTEXT = {
  'normal': 'street_address_column,context,city,state,country',
  'advance': 'street_address_template,context,city,state,country'
};

module.exports = {
  type: 'georeference-street-address',
  label: _t('editor.layers.analysis-form.georeference.street-address'),
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
    street_address_column: ['required'],
    street_address_template: ['required']
  },

  parse: function (nodeAttrs) {
    var attrs = {
      type: 'georeference-street-address',
      city: nodeAttrs.city || nodeAttrs.city_column || '',
      state: nodeAttrs.state || nodeAttrs.state_column || '',
      country: nodeAttrs.country || nodeAttrs.country_column || ''
    };

    if (nodeAttrs.context === 'advance') {
      attrs.street_address_template = nodeAttrs.street_address_column && this._wrapInBraces(nodeAttrs.street_address_column) || nodeAttrs.street_address_template || '';
    } else {
      attrs.street_address_column = nodeAttrs.street_address_column || '';
    }

    return attrs;
  },

  _wrapInBraces: function (fragments) {
    return ['{{', fragments, '}}'].join('');
  },

  getParameters: function (context) {
    if (!context) {
      context = 'normal';
    }
    return PARAMETERS_FOR_CONTEXT[context];
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
