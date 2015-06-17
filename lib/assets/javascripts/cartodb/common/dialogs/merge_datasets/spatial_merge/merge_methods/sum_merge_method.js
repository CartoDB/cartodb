var cdb = require('cartodb.js');

/**
 * Merge method to create SQL query for doing a spatial sum.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    name: 'sum',
    desc: 'Calculates the number of intersecting records',
    selected: false
  },

  sqlSelectClause: function(tableName, columnName) {
    return 'SUM(' + tableName + '.' + columnName + ')';
  }
});
