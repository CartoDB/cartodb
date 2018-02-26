module.exports = {
  type: 'georeference-placeholder',
  label: null,
  keyAttr: 'label',
  parametersDataFields: 'latitude,longitude',
  fieldAttrs: {
    latitude: {
      showSearch: true
    },
    longitude: {
      showSearch: true
    }
  },

  validatorFor: {
  },

  parse: function (nodeAttrs) {
    return {
      type: 'georeference-placeholder',
      latitude: null,
      longitude: null
    };
  },

  getParameters: function () {
    var params = this.parametersDataFields;

    return params;
  },

  formatAttrs: function (formAttrs) {
    return formAttrs;
  }
};
