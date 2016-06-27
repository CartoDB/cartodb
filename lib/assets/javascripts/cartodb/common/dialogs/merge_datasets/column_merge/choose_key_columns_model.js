var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var Backbone = require('backbone-cdb-v3');
var cdb = require('cartodb.js-v3');
var ChooseKeyColumnsView = require('./choose_key_columns_view');
var SelectColumns = require('./select_columns_model');

module.exports = cdb.core.Model.extend({

  INSTRUCTIONS_SAFE_HTML: 'Select the dataset on the right that you want to merge the left with. ' +
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
    this.set('gotoNextStep', false);
    var leftColumns = this.get('leftColumns');
    leftColumns.each(function(m) {
      m.unset('selected');
    });
    this.get('rightColumns').reset(); // columns are fetched by view
    this._resetSorting(leftColumns);
    this._resetSorting(this.get('rightColumns'));

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
    var selectedLeftColumn = this.selectedItemFor('leftColumns');
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
    var isReady = !!(this.selectedItemFor('leftColumns') &&
                  this.selectedItemFor('rightColumns') &&
                  this.get('rightTableData'));
    this.set('isReadyForNextStep', isReady);
  },

  nextStep: function() {
    return new this.constructor.nextStep({
      user: this.get('user'),
      leftTable: this.get('leftTable'),
      leftColumns: this.get('leftColumns'),
      leftKeyColumn: this.selectedItemFor('leftColumns').clone(),
      rightKeyColumn: this.selectedItemFor('rightColumns').clone(),
      rightColumns: this.get('rightColumns'),
      rightTableData: this.get('rightTableData')
    });
  },

  selectedItemFor: function(collectionName) {
    return this.get(collectionName).find(function(column) {
      return column.get('selected');
    });
  },

  _initColumns: function() {
    var filteredLeftColumns = this._filterColumns(this.get('leftTable').get('schema'));
    this.set('leftColumns', new Backbone.Collection(filteredLeftColumns));
    this.set('rightColumns', new Backbone.Collection([]));
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
  },

  _resetSorting: function(columns) {
    // May been set on next step, so reset sorters if going back:
    columns.comparator = function(column) {
      return column.get('name');
    };
    columns.sort();
  }

}, {
  header: {
    icon: 'CDB-IconFont-play',
    title: 'Choose merge column'
  },
  nextStep: SelectColumns
});
