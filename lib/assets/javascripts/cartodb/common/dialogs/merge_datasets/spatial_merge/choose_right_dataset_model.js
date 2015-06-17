var cdb = require('cartodb.js');
var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var SumMergeMethod = require('./merge_methods/sum_merge_method');
var AVGMergeMethod = require('./merge_methods/avg_merge_method');
var CountMergeMethod = require('./merge_methods/count_merge_method');
var SpatialMergeView = require('./spatial_merge_view');
var ChooseMergeMethod = require('./choose_merge_method_model');

/**
 * First step for a spatial merge - select a dataset table.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    instructions: 'Calculate the intersecting geospatial records between two datasets (ex. points in polygons).<br/>' +
      "You'll need to decide the operation to perform here.",

    user: undefined,
    goDirectlyToNextStep: false,
    leftTable: undefined,
    excludeColumns: undefined,
    leftKeyColumn: undefined,
    leftColumns: undefined,
    mergeMethods: undefined,

    rightTableData: undefined,
    rightColumns: undefined
  },

  initialize: function(attrs) {
    if (!attrs.leftTable) throw new Error('leftTable is required');
    if (!attrs.excludeColumns || _.isEmpty(attrs.excludeColumns)) cdb.log.error('excludeColumns was empty');
    this.elder('initialize');
    this._initColumns();
    this._initLeftKeyColumn();
    this._initMergeMethods();
  },

  reset: function() {
    this.set({
      goDirectlyToNextStep: false,
      rightTableData: undefined
    });
    this.get('mergeMethods').each(function(m) {
      m.set({
        selected: false,
        isDisabled: true
      });
    });
  },

  createView: function() {
    return new SpatialMergeView({
      model: this
    });
  },

  assertIfReadyForNextStep: function() {
    // Always return false, uses goDirectlyToNextStep to change to next step anyway
    return false;
  },

  fetchRightColumns: function(tableData) {
    this.set('rightTableData', tableData);
    // TODO: extracted from old code, cdb.admin.TableColumnSelector._getColumns,
    //   isnt there some better way to get the schema/columns?
    $.ajax({
      url: cdb.config.prefixUrl() + '/api/v1/tables/' + tableData.id,
      dataType: 'jsonp',
      success: this._onFetchedRightColumns.bind(this)
    });
  },

  nextStep: function() {
    return new this.constructor.nextStep({
      user: this.get('user'),
      mergeMethods: this.get('mergeMethods'),
      leftTable: this.get('leftTable'),
      leftKeyColumn: this.get('leftKeyColumn'),
      leftColumns: this.get('leftColumns'),
      rightTableData: this.get('rightTableData'),
      rightKeyColumn: this._rightKeyColumn(),
      rightColumns: this.get('rightColumns')
    });
  },

  // TODO: basically same as
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

  _initMergeMethods: function() {
    var mergeMethods = new Backbone.Collection([
      new SumMergeMethod(),
      new CountMergeMethod(),
      new AVGMergeMethod()
    ]);
    this.set('mergeMethods', mergeMethods);
  },

  _filterColumns: function(tableSchema) {
    var excludeColumns = this.get('excludeColumns');

    return _.chain(tableSchema)
      .map(this._columnDataToColumn)
      .reject(function(column) {
        return _.contains(excludeColumns, column.name);
      })
      .value();
  },

  _columnDataToColumn: function(columnData) {
    return {
      // TODO: why don't we use a proper model for schema, to provide convenient method to get columns as a collection already?
      name: columnData[0],
      type: columnData[1]
    };
  },

  _initLeftKeyColumn: function() {
    var theGeomColumn = this.get('leftColumns').find(this._isColumnTheGeom);
    this.set('leftKeyColumn', theGeomColumn.clone());
  },

  _onFetchedRightColumns: function(results) {
    var filteredColumns = this._filterColumns(results.schema);
    this.get('rightColumns').reset(filteredColumns, { silent: true }); // handled in next step
    this.set('goDirectlyToNextStep', true);
  },

  _rightKeyColumn: function() {
    return this.get('rightColumns')
      .find(this._isColumnTheGeom)
      .clone();
  },

  _isColumnTheGeom: function(column) {
    return column.get('name') === 'the_geom';
  }

}, {
  header: {
    icon: 'iconFont-Play',
    title: 'Choose dataset to merge'
  },
  nextStep: ChooseMergeMethod
});
