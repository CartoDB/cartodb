var cdb = require('cartodb-deep-insights.js');

module.exports = cdb.core.Model.extend({

  defaults: {
    schema: {}
  },

  initialize: function (attrs, opts) {
    this.schema = {
      source: {
        type: 'Select',
        options: [ this.get('source') ]
      },
      kind: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.type'),
        options: [
          {
            val: 'walk',
            label: _t('editor.layers.analysis-form.by-walk')
          }, {
            val: 'drive',
            label: _t('editor.layers.analysis-form.by-car')
          }, {
            val: 'bike',
            label: _t('editor.layers.analysis-form.by-bike')
          }
        ]
      },
      time: {
        type: 'Number',
        text: _t('editor.layers.analysis-form.time'),
        validators: ['required']
      }
    };
  }

});
