var cdb = require('cartodb-deep-insights.js');

module.exports = cdb.core.Model.extend({

  defaults: {
    schema: {}
  },

  updateSchema: function () {
    this.schema = {
      source_id: {
        type: 'Select',
        options: [ this.get('source_id') ]
      },
      radio: {
        type: 'Number',
        validators: ['required']
      }
    };
  }

});
