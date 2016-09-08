var Backbone = require('backbone');

module.exports = Backbone.Model.extend({
  defaults: {
    fill: {
      'color': {
        'fixed': '#fabada',
        'opacity': 0.9
      }
    }
  },

  schema: {
    fill: {
      type: 'Fill',
      title: '',
      options: [],
      editorAttrs: {
        color: {
          hidePanes: ['value']
        },
        className: 'LegendItem-inner'
      }
    },
    name: {
      type: 'Text',
      title: '',
      editorAttrs: {
        className: 'LegendItem-inner',
        placeholder: _t('editor.legend.legend-form.untitled')
      }
    }
  }
});
