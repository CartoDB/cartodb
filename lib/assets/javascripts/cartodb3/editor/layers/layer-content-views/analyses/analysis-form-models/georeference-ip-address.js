var _ = require('underscore');

module.exports = {
  type: 'georeference-ip-address',
  label: _t('editor.layers.analysis-form.georeference-ip-address'),
  fieldAttrs: {
    ip_address: {
      showSearch: true
    }
  },

  validatorFor: {
    ip_address: ['required']
  },

  parametersDataFields: 'ip_address',

  parse: function (nodeAttrs) {
    var opts = {
      ip_address: nodeAttrs.ip_address
    };

    return _.extend({
      type: 'georeference-ip-address'
    }, opts);
  },

  formatAttrs: function (formAttrs) {
    return formAttrs;
  }
};
