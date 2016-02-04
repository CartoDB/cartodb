var TablesCollection = require('./tables-collection');
var cdb = require('cartodb-deep-insights.js');

/**
 * Model representing a user
 */
module.exports = cdb.core.Model.extend({

  initialize: function (attrs, opts) {
    this.tablesCollection = new TablesCollection(this.get('table_names'), { baseUrl: attrs.base_url });
  }
});
