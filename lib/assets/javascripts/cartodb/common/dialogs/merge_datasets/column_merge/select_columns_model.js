var cdb = require('cartodb.js');
var SelectColumnsView = require('./select_columns_view');
var generateMergeColumnSQL = require('./generate_merge_column_sql');
var MergeModel = require('../merge_step_model');

/**
 * View for 2nd step of a column merge, where the user should select the column fields to merge
 */
module.exports = cdb.core.Model.extend({

  instructions: 'Select the columns you want to add as well.',

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

  reset: function() {
    this.get('leftColumns').each(function(column) {
      column.set('selected', true);
    });
    this.get('rightColumns').each(function(column) {
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

    var sql = generateMergeColumnSQL({
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
  }

}, {
  header: {
    icon: 'iconFont-Wizard',
    title: 'Choose the rest to add'
  },
  nextStep: MergeModel
});
