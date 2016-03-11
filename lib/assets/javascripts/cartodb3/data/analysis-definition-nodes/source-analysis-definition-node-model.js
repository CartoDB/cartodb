var cdb = require('cartodb.js');

/**
 * Node for a dataset SQL source
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    type: 'source'
  },

  parse: function (r) {
    return {
      id: r.id,
      query: r.params.query
    };
  },

  toJSON: function () {
    return {
      id: this.id,
      type: this.get('type'),
      params: {
        query: this.get('query')
      }
    };
  }

});
