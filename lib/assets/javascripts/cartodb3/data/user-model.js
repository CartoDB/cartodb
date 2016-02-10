var cdb = require('cartodb-deep-insights.js');

/**
 * Model representing a user
 */
module.exports = cdb.core.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.tablesCollection) throw new Error('tablesCollection is required');
    this.tablesCollection = opts.tablesCollection;
  }
});
