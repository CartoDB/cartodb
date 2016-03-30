var cdb = require('cartodb-deep-insights.js');

module.exports = cdb.core.Model.extend({

  defaults: {
    schema: {}
  },

  initialize: function () {
    this.schema = {
      source: {
        type: 'Select',
        options: [ this.get('source') ]
      },
      radio: {
        type: 'Number',
        validators: ['required']
      }
    };
  }

});
