module.exports = {
  type: 'line-to-single-point',
  label: _t('editor.layers.analysis-form.line-to-single-point'),

  parametersDataFields: 'mode,destination_longitude,destination_latitude,units',

  parse: function (nodeAttrs) {
    return {
      type: 'line-to-single-point'
    };
  },

  formatAttrs: function (formAttrs, columnOptions) {
    return formAttrs;
  }
};
