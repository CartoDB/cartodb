var cdb = require('cartodb.js');

/**
 * Merge method to create SQL query for doing a spatial count.
 */
module.exports = cdb.core.Model.extend({

  name: 'count',
  desc: 'Sums of a column for all intersecting records',

  defaults: {
    disabled: false,
    selected: false
  },

  changedMergeColumn: function(newMergeColumn) {
  },

  sqlSelectClause: function() {
    return 'COUNT(*)';
  }
});
