var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
var cdb = require('cartodb.js');
var ChooseKeyColumnsView = require('./choose_key_columns_view');
var SelectColumns = require('./select_columns_model');

module.exports = cdb.core.Model.extend({

  defaults: {
    instructions: 'First, select the column you want to merge in both datasets. ' +
      'You can only merge datasets by joining by columns of the same type (e.g. number to a number).',

    isReadyForNextStep: false,
    table: undefined,
    mergeTableData: undefined,
    actualColumns: undefined,
    mergecolumns: undefined
  },

  initialize: function() {
    this.elder('initialize');

    var availableColumns = _.filter(this.get('filteredColumns'), function(column) {
      return column[0] !== 'the_geom';
    });
    this.set('actualColumns', new Backbone.Collection(availableColumns));
    this.set('mergeColumns', new Backbone.Collection());
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
    this.get('mergeColumns').reset(results.schema);
  },

  assertIfReadyForNextStep: function() {
    var isReady = this._selectedItem('actualColumns') &&
                  this._selectedItem('mergeColumns') &&
                  this.get('mergeTableData');
    this.set('isReadyForNextStep', isReady);
  },

  nextStep: function() {
    return new this.constructor.nextStep({
      actualTable: this.get('table'),
      mergeTable: this.get('mergeTableData'),
      actualKeyColumn: this._selectedItem('actualColumns'),
      mergeKeyColumn: this._selectedItem('mergeColumns')
    });
  },

  _selectedItem: function(collectionName) {
    return this.get(collectionName).find(function(column) {
      return column.get('selected');
    });
  }


}, {
  header: {
    icon: 'iconFont-Play',
    title: 'Choose merge column'
  },
  nextStep: SelectColumns
});
