var _ = require('underscore');

module.exports = {
  type: 'georeference-country',
  label: _t('editor.layers.analysis-form.georeference-country'),
  fieldAttrs: {
    country_column: {
      showSearch: true
    }
  },

  validatorFor: {
    country_column: ['required']
  },

  parametersDataFields: 'country_column',

  parse: function (nodeAttrs) {
    var opts = {
      country_column: nodeAttrs.country_column || nodeAttrs.country
    };

    return _.extend({
      type: 'georeference-country'
    }, opts);
  },

  formatAttrs: function (formAttrs) {
    return formAttrs;
  }
};
