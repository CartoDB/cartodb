var cdb = require('cartodb.js-v3');

/**
 * Merge method to create SQL query for doing a spatial AVG.
 */
module.exports = cdb.core.Model.extend({

  NAME: 'avg',

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
