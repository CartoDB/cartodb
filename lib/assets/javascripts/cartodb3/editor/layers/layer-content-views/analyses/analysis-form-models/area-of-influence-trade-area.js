module.exports = {
  templateData: {
    parametersDataFields: 'type,kind,time,isolines,dissolved'
  },
  parse: function (nodeAttrs) {
    return {
      type: 'trade-area',
      kind: nodeAttrs.kind || 'walk',
      isolines: nodeAttrs.isolines || 1,
      time: nodeAttrs.time || 100,
      dissolved: nodeAttrs.dissolved === 'true' || nodeAttrs.dissolved === true
    };
  },
  createSchema: function (formModel) {
    return {
      kind: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.by'),
        options: [
          {
            val: 'walk',
            label: _t('editor.layers.analysis-form.by-walk')
          }, {
            val: 'car',
            label: _t('editor.layers.analysis-form.by-car')
          }
        ]
      },
      isolines: {
        type: 'Number',
        title: _t('editor.layers.analysis-form.tracts'),
        validators: ['required', {
          type: 'interval',
          min: 1,
          max: 6
        }]
      },
      time: {
        type: 'Number',
        title: _t('editor.layers.analysis-form.time'),
        validators: ['required', {
          type: 'interval',
          min: 1,
          max: 3600
        }]
      },
      dissolved: {
        type: 'Radio',
        title: _t('editor.layers.analysis-form.boundaries'),
        options: [
          {
            val: 'false',
            label: _t('editor.layers.analysis-form.intact')
          }, {
            val: 'true',
            label: _t('editor.layers.analysis-form.dissolved')
          }
        ]
      }
    };
  },
  formatAttrs: function (formAttrs) {
    return formAttrs;
  }
};
