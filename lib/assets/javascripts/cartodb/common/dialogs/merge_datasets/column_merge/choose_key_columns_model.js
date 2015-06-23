var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var cdb = require('cartodb.js');
var ChooseKeyColumnsView = require('./choose_key_columns_view');
var SelectColumns = require('./select_columns_model');

module.exports = cdb.core.Model.extend({

  instructions: 'First, select the column you want to merge in both datasets. ' +
    'You can only merge datasets by joining by columns of the same type (e.g. number to a number).',

  defaults: {
    user: undefined,
    isReadyForNextStep: false,
    excludeColumns: [],
    leftTable: undefined,
    leftColumns: undefined,
    rightTableData: undefined,
    rightColumns: undefined
  },

  initialize: function() {
    this._initColumns();
  },

  createView: function() {
    // Reset state
    this.get('leftColumns').each(function(m) {
      m.unset('selected');
    });
    this.get('leftColumns').comparator = this._columnsSortComparator;
    this.get('rightColumns').comparator = this._columnsSortComparator;

    return new ChooseKeyColumnsView({
      model: this
    });
  },

  changeRightTable: function(tableData) {
    this.get('rightColumns').reset();
    this.set('rightTableData', tableData);

    // TODO: extracted from old code, cdb.admin.TableColumnSelector._getColumns,
    //   isnt there some better way to get the schema/columns?
    $.ajax({
      url: cdb.config.prefixUrl() + '/api/v1/tables/' + tableData.id,
      dataType: 'jsonp',
      success: this._onFetchedColumns.bind(this)
    });
  },

  _onFetchedColumns: function(results) {
    var filteredColumns = this._filterColumns(results.schema);
    this.get('rightColumns').reset(filteredColumns);
    var selectedLeftColumn = this._selectedItemFor('leftColumns');
    if (selectedLeftColumn) {
      this.disableRightColumnsNotMatchingType(selectedLeftColumn.get('type'));
    }
  },

  disableRightColumnsNotMatchingType: function(leftKeyColumnType) {
    this.get('rightColumns').each(function(column) {
      var shouldDisable = column.get('type') !== leftKeyColumnType;
      if (shouldDisable && column.get('selected')) {
        // Don't leave the column selected if should be disabled
        column.set('selected', false);
      }
      column.set('disabled', shouldDisable);
    });
  },

  assertIfReadyForNextStep: function() {
    var isReady = !!(this._selectedItemFor('leftColumns') &&
                  this._selectedItemFor('rightColumns') &&
                  this.get('rightTableData'));
    this.set('isReadyForNextStep', isReady);
  },

  nextStep: function() {
    return new this.constructor.nextStep({
      user: this.get('user'),
      leftTable: this.get('leftTable'),
      leftColumns: this.get('leftColumns'),
      leftKeyColumn: this._selectedItemFor('leftColumns').clone(),
      rightKeyColumn: this._selectedItemFor('rightColumns').clone(),
      rightColumns: this.get('rightColumns'),
      rightTableData: this.get('rightTableData')
    });
  },

  _selectedItemFor: function(collectionName) {
    return this.get(collectionName).find(function(column) {
      return column.get('selected');
    });
  },

  _initColumns: function() {
    var filteredLeftColumns = this._filterColumns(this.get('leftTable').get('schema'));
    this.set('leftColumns', new Backbone.Collection(filteredLeftColumns));
    this.set('rightColumns', new Backbone.Collection([]));
  },

  _columnsSortComparator: function(column) {
    var columnName = column.get('name');
    // sort by priority of selected, the_geom, and then the rest alphabetically
    if (column.get('selected')) {
      return '00000';
    } else if (columnName === 'the_geom') {
      return '00001';
    } else {
      return columnName;
    }
  },

  _filterColumns: function(tableSchema) {
    var excludeColumns = this.get('excludeColumns');

    return _.chain(tableSchema)
      .map(function(columnData) {
        return {
          // TODO: why don't we use a proper model for schema, to provide convenient method to get columns as a collection already?
          name: columnData[0],
          type: columnData[1]
        };
      })
      .reject(function(column) {
        return _.contains(excludeColumns, column.name);
      })
      .value();
  }

}, {
  header: {
    icon: 'iconFont-Play',
    title: 'Choose merge column'
  },
  nextStep: SelectColumns
});
