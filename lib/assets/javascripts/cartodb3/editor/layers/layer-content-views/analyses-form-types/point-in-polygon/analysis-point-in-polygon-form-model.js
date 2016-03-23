var cdb = require('cartodb-deep-insights.js');

module.exports = cdb.core.Model.extend({

  defaults: {
    schema: {}
  },

  initialize: function (attrs, opts) {
    this.schema = {
      source_id: {
        type: 'Select',
        options: [ this.get('source_id') ]
      },
      points_source: {
        type: 'Select',
        options: [ this.get('points_source') ]
      },
      polygons_source: {
        type: 'Select',
        options: [ this.get('polygons_source') ]
      }
    };
  }

});
