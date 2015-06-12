var cdb = require('cartodb.js');

/**
 * Merge method to create SQL query for doing a spatial AVG.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    name: 'avg',
    selected: false
  },

  initialize: function() {
    this.elder('initialize');
  },

  sql: function() {
  }
});
