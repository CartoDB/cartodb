var cdb = require('cartodb-deep-insights.js');

module.exports = cdb.core.Model.extend({

  defaults: {
    schema: {}
  },

  initialize: function (attrs, opts) {},

  updateSchema: function () {
    this.schema = {
      source_id: {
        type: 'Select',
        options: [ this.get('source_id') ]
      },
      kind: {
        type: 'Select',
        options: [
          {
            val: 'walk',
            label: _t('editor.layers.analysis-form.by-walk')
          },
          {
            val: 'drive',
            label: _t('editor.layers.analysis-form.by-car')
          },
          {
            val: 'bike',
            label: _t('editor.layers.analysis-form.by-bike')
          }
        ]
      },
      time: {
        type: 'Number',
        validators: ['required']
      }
    };
  }

});
