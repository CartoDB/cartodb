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

    user: undefined,
    isReadyForNextStep: false,
    excludeColumns: [],
    leftTable: undefined,
    leftColumns: undefined,
    rightTableData: undefined,
    rightColumns: undefined
  },

  initialize: function() {
    this.elder('initialize');

    this._initColumns();
  },

  reset: function() {
    this.get('leftColumns').each(function(m) {
      m.unset('selected');
    });
  },

  createView: function() {
    return new ChooseKeyColumnsView({
      model: this
    });
  },

  fetchRightColumns: function() {
    var tableData = this.get('rightTableData');
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
  },

  assertIfReadyForNextStep: function() {
    var isReady = this._selectedItemFor('leftColumns') &&
                  this._selectedItemFor('rightColumns') &&
                  this.get('rightTableData');
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
    var sortAlphabeticallyExceptForTheGeom = function(column) {
      var columnName = column.get('name');
      return columnName === 'the_geom' ? columnName : -1;
    };

    var filteredLeftColumns = this._filterColumns(this.get('leftTable').get('schema'));
    this.set('leftColumns', new Backbone.Collection(filteredLeftColumns, {
      comparator: sortAlphabeticallyExceptForTheGeom
    }));
    this.set('rightColumns', new Backbone.Collection([], {
      comparator: sortAlphabeticallyExceptForTheGeom
    }));
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
