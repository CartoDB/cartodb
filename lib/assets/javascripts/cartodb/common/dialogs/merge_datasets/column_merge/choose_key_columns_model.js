var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var cdb = require('cartodb.js');
var ChooseKeyColumnsView = require('./choose_key_columns_view');
var SelectColumns = require('./select_columns_model');

module.exports = cdb.core.Model.extend({

  defaults: {
    instructions: 'First, select the column you want to merge in both datasets. ' +
      'You can only merge datasets by joining by columns of the same type (e.g. number to a number).',

    isReadyForNextStep: false,
    excludeColumns: [],
    actualTable: undefined,
    actualColumns: undefined,
    mergeTableData: undefined,
    mergecolumns: undefined
  },

  initialize: function() {
    this.elder('initialize');

    this._initColumns();
  },

  reset: function() {
    this.get('actualColumns').each(function(m) {
      m.unset('selected');
    });
  },

  createView: function() {
    return new ChooseKeyColumnsView({
      model: this
    });
  },

  fetchMergeColumns: function() {
    var tableData = this.get('mergeTableData');
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
    this.get('mergeColumns').reset(filteredColumns);
  },

  assertIfReadyForNextStep: function() {
    var isReady = this._selectedItemFor('actualColumns') &&
                  this._selectedItemFor('mergeColumns') &&
                  this.get('mergeTableData');
    this.set('isReadyForNextStep', isReady);
  },

  nextStep: function() {
    return new this.constructor.nextStep({
      actualTable: this.get('actualTable'),
      actualColumns: this.get('actualColumns'),
      actualKeyColumn: this._selectedItemFor('actualColumns').clone(),
      mergeKeyColumn: this._selectedItemFor('mergeColumns').clone(),
      mergeColumns: this.get('mergeColumns'),
      mergeTableData: this.get('mergeTableData')
    });
  },

  _selectedItemFor: function(collectionName) {
    return this.get(collectionName).find(function(column) {
      return column.get('selected');
    });
  },

  _initColumns: function() {
    var sortAlphabeticallyExceptForTheGeom = function(column) {
      var columnName = column[0];
      return columnName === 'the_geom' ? columnName : -1;
    };

    var filteredActualColumns = this._filterColumns(this.get('actualTable').get('schema'));
    this.set('actualColumns', new Backbone.Collection(filteredActualColumns, {
      comparator: sortAlphabeticallyExceptForTheGeom
    }));
    this.set('mergeColumns', new Backbone.Collection([], {
      comparator: sortAlphabeticallyExceptForTheGeom
    }));
  },

  _filterColumns: function(tableSchema) {
    var excludeColumns = this.get('excludeColumns');

    return _.reject(tableSchema, function(column) {
      var columnName = column[0];
      return _.contains(excludeColumns, columnName);
    });
  }

}, {
  header: {
    icon: 'iconFont-Play',
    title: 'Choose merge column'
  },
  nextStep: SelectColumns
});
