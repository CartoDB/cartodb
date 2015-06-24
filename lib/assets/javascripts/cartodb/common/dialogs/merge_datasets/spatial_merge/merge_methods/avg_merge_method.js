var cdb = require('cartodb.js');

/**
 * Merge method to create SQL query for doing a spatial AVG.
 */
module.exports = cdb.core.Model.extend({

  name: 'avg',
  desc: 'Calculates the average value of a column for all intersecting records',

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
    return 'AVG(' + tableName + '.' + columnName + ')';
  }
});
