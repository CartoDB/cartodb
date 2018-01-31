module.exports = {
  type: 'georeference-long-lat',
  label: _t('editor.layers.analysis-form.georeference.long-lat'),
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
    latitudde: ['required'],
    longitude: ['required']
  },

  parse: function (nodeAttrs) {
    return {
      type: 'georeference-long-lat',
      latitude: nodeAttrs.latitude,
      longitude: nodeAttrs.longitude
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
