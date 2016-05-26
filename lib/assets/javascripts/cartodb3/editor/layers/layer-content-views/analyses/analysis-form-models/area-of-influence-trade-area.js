var _ = require('underscore');

module.exports = {
  templateData: {
    parametersDataFields: 'type,kind,time,isolines,dissolved'
  },
  parse: function (attrs) {
    return {
      type: 'trade-area',
      kind: attrs.kind || 'walk',
      isolines: parseFloat(attrs.isolines) || 1,
      time: parseFloat(attrs.time) || 100,
      dissolved: attrs.dissolved === 'true' || attrs.dissolved === true
    };
  },
  createSchema: function (attrs) {
    return {
      source: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.source'),
        options: [ attrs.source ],
        editorAttrs: { disabled: true }
      },
      type: {
        type: 'Radio',
        title: _t('editor.layers.analysis-form.type'),
        options: [
          {
            val: 'buffer',
            label: _t('editor.layers.analysis-form.distance')
          }, {
            val: 'trade-area',
            label: _t('editor.layers.analysis-form.time')
          }
        ]
      },
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
  toNodeAttrs: function (attrs) {
    return _.defaults(
      {
        dissolved: attrs.dissolved === 'true' || attrs.dissolved === true,
        isolines: parseInt(attrs.isolines, 10),
        time: parseInt(attrs.time, 10)
      },
      attrs
    );
  }
};
