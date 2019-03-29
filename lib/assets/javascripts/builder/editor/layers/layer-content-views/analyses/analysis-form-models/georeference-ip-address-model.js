module.exports = {
  type: 'georeference-ip-address',
  label: _t('editor.layers.analysis-form.georeference.ip-address'),
  fieldAttrs: {
    ip_address: {
      showSearch: true
    }
  },

  validatorFor: {
    ip_address: ['required']
  },

  parametersDataFields: 'ip_address',

  getParameters: function () {
    var params = this.parametersDataFields;

    return params;
  },

  parse: function (nodeAttrs) {
    return {
      type: 'georeference-ip-address',
      ip_address: nodeAttrs.ip_address
    };
  },

  formatAttrs: function (formAttrs) {
    return formAttrs;
  }
};
