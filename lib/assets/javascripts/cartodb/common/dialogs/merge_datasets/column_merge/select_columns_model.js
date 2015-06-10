var cdb = require('cartodb.js');
var SelectColumnsView = require('./select_columns_view');
var generateMergeColumnSQL = require('./generate_merge_column_sql');

/**
 * View for 2nd step of a column merge, where the user should select the column fields to merge
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    instructions: 'Select the columns you want to add as well.',

    isReadyForNextStep: true,
    actualTable: undefined,
    actualKeyColumn: undefined,
    actualColumns: undefined,
    mergeTableData: undefined,
    mergeColumns: undefined,
    mergeKeyColumn: undefined
  },

  initialize: function() {
    this.elder('initialize');
  },

  reset: function() {
    this.get('actualColumns').each(function(column) {
      column.set('selected', true);
    });
    this.get('mergeColumns').each(function(column) {
      if (column.get('name') !== 'the_geom') {
        column.set('selected', true);
      }
    });
  },

  createView: function() {
    return new SelectColumnsView({
      model: this
    });
  },

  onlyAllowOneSelectedTheGeomColumn: function(column, isSelected) {
    if (column.get('name') !== 'the_geom') return;

    var actualColumn = this._theGeomColumnFor('actualColumns');
    var mergeColumn = this._theGeomColumnFor('mergeColumns');

    if (column === actualColumn) {
      actualColumn.set('selected', isSelected);
      mergeColumn.set('selected', !isSelected);
    } else if (column === mergeColumn) {
      actualColumn.set('selected', !isSelected);
      mergeColumn.set('selected', isSelected);
    }
  },

  generateSQLQuery: function() {
    var actualKeyColumn = this.get('actualKeyColumn');
    var mergeKeyColumn = this.get('mergeKeyColumn');

    return generateMergeColumnSQL({
      actualTableName     : this.get('actualTable').get('name'),
      actualKeyColumnName : actualKeyColumn.get('name'),
      actualKeyColumnType : actualKeyColumn.get('type'),
      actualColumnsName   : this._selectedColumnsNamesFor('actualColumns'),
      mergeTableName      : this.get('mergeTableData').name,
      mergeKeyColumnName  : mergeKeyColumn.get('name'),
      mergeKeyColumnType  : mergeKeyColumn.get('type'),
      mergeColumnsNames   : this._selectedColumnsNamesFor('mergeColumns')
    });
  },

  _selectedColumnsNamesFor: function(collectionName) {
    return this.get(collectionName)
      .chain()
      .filter(function(column) {
        return column.get('selected');
      }).
      map(function(column) {
        return column.get('name');
      })
      .value();
  },

  _theGeomColumnFor: function(which) {
    return this.get(which).find(function(column) {
      return column.get('name') === 'the_geom';
    });
  }

}, {
  header: {
    icon: 'iconFont-Wizard',
    title: 'Choose the rest to add'
  }
});
