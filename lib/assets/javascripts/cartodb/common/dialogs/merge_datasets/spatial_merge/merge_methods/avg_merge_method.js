var cdb = require('cartodb.js');

/**
 * Merge method to create SQL query for doing a spatial AVG.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    name: 'avg',
    desc: 'Calculates the average value of a column for all intersecting records',
    selected: false
  },

  initialize: function() {
    this.elder('initialize');
  },

  sqlSelectClause: function(tableName, columnName) {
    return 'AVG(' + tableName + '.' + columnName + ')';
  }
});
