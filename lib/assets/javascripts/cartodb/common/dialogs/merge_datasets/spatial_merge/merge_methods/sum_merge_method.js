var cdb = require('cartodb.js');

/**
 * Merge method to create SQL query for doing a spatial sum.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    name: 'sum',
    selected: false
  },

  initialize: function() {
    this.elder('initialize');
  },

  sqlSelectClause: function(tableName, columnName) {
    return 'SUM(' + tableName + '.' + columnName + ')';
  }
});
