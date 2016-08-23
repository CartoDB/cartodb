module.exports = {
  type: 'line-to-single-point',
  label: _t('editor.layers.analysis-form.line-to-single-point'),

  parametersDataFields: 'source,type,destination_longitude,destination_latitude',
  parametersDataSchema: 'destination_longitude,destination_latitude',

  parse: function (nodeAttrs) {
    return {
      type: 'line-to-single-point'
    };
  },

  formatAttrs: function (formAttrs, columnOptions) {
    return formAttrs;
  }
};
