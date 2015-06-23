var cdb = require('cartodb.js');

/**
 * Merge method to create SQL query for doing a spatial sum.
 */
module.exports = cdb.core.Model.extend({

  name: 'sum',
  desc: 'Calculates the number of intersecting records',

  defaults: {
    disabled: false,
    selected: false
  },

  changedMergeColumn: function(newMergeColumn) {
    var shouldDisable = !newMergeColumn || newMergeColumn.get('type') !== 'number';
    this.set({
      disabled: shouldDisable,
      selected: this.get('selected') && !shouldDisable
    });
  },

  sqlSelectClause: function(tableName, columnName) {
    return 'SUM(' + tableName + '.' + columnName + ')';
  }
});
