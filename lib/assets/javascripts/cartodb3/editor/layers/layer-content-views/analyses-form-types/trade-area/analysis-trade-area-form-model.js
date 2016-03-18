var _ = require('underscore');
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
        options: ['walk', 'drive', 'bike']
      },
      time: {
        type: 'Number',
        validators: ['required']
      }
    };
  }

});
