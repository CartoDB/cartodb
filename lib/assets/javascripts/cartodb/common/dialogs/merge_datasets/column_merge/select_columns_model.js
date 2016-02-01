var cdb = require('cartodb.js-v3');
var SelectColumnsView = require('./select_columns_view');
var generateColumnMergeSQL = require('./generate_column_merge_sql');
var MergeModel = require('../merge_step_model');

/**
 * View for 2nd step of a column merge, where the user should select the column fields to merge
 */
module.exports = cdb.core.Model.extend({

  INSTRUCTIONS_SAFE_HTML: 'Choose other columns you want in your dataset.',

  defaults: {
    user: undefined,
    isReadyForNextStep: true,
    leftTable: undefined,
    leftKeyColumn: undefined,
    leftColumns: undefined,
    rightTableData: undefined,
    rightColumns: undefined,
    rightKeyColumn: undefined
  },

  createView: function() {
    // Reset state
    this.set('gotoNextStep', false);
    this._resetColumns(this.get('leftColumns'), function(column) {
      column.set('selected', true);
    });
    this._resetColumns(this.get('rightColumns'), function(column) {
      if (column.get('name') !== 'the_geom') {
        column.set('selected', true);
      }
      column.set('disabled', false);
    });

    return new SelectColumnsView({
      model: this
    });
  },

  onlyAllowOneSelectedTheGeomColumn: function(column, isSelected) {
    if (column.get('name') !== 'the_geom') return;

    var leftColumn = this._theGeomColumnFor('leftColumns');
    var rightColumn = this._theGeomColumnFor('rightColumns');

    if (column === leftColumn) {
      leftColumn.set('selected', isSelected);
      rightColumn.set('selected', !isSelected);
    } else if (column === rightColumn) {
      leftColumn.set('selected', !isSelected);
      rightColumn.set('selected', isSelected);
    }
  },

  nextStep: function() {
    var leftKeyColumn = this.get('leftKeyColumn');
    var rightKeyColumn = this.get('rightKeyColumn');

    var sql = generateColumnMergeSQL({
      leftTableName: this.get('leftTable').get('name'),
      leftKeyColumnName: leftKeyColumn.get('name'),
      leftKeyColumnType: leftKeyColumn.get('type'),
      leftColumnsNames: this._selectedColumnsNamesFor('leftColumns'),
      rightTableName: this.get('rightTableData').name,
      rightKeyColumnName: rightKeyColumn.get('name'),
      rightKeyColumnType: rightKeyColumn.get('type'),
      rightColumnsNames: this._selectedColumnsNamesFor('rightColumns')
    });

    return new this.constructor.nextStep({
      user: this.get('user'),
      tableName: this.get('leftTable').get('name'),
      sql: sql
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
  },

  _resetColumns: function(columns, eachReset) {
    columns.comparator = function(column) {
      var columnName = column.get('name');
      return columnName === 'the_geom' ? '00000' : columnName;
    };
    columns.each(eachReset, this);
    columns.sort();
  }

}, {
  header: {
    icon: 'CDB-IconFont-wizard',
    title: 'Choose the rest to add'
  },
  nextStep: MergeModel
});
