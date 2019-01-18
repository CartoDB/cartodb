module.exports = {
  type: 'trade-area',
  label: _t('editor.layers.analysis-form.time'),
  parametersDataFields: 'type,kind,time,isolines,dissolved',

  parse: function (nodeAttrs) {
    return {
      type: 'trade-area',
      kind: nodeAttrs.kind || 'walk',
      isolines: nodeAttrs.isolines || 1,
      time: nodeAttrs.time || 100,
      dissolved: nodeAttrs.dissolved === 'true' || nodeAttrs.dissolved === true
    };
  },

  formatAttrs: function (formAttrs) {
    return formAttrs;
  }
};
