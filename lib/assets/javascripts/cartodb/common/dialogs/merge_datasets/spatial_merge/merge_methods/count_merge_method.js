var cdb = require('cartodb.js');

/**
 * Merge method to create SQL query for doing a spatial count.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    name: 'count',
    desc: 'Sums of a column for all intersecting records',
    selected: false
  },

  initialize: function() {
    this.elder('initialize');
  },

  sqlSelectClause: function() {
    return 'COUNT(*)';
  }
});
