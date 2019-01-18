var cdb = require('cartodb.js-v3');
var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var Backbone = require('backbone-cdb-v3');
var SumMergeMethod = require('./merge_methods/sum_merge_method');
var AVGMergeMethod = require('./merge_methods/avg_merge_method');
var CountMergeMethod = require('./merge_methods/count_merge_method');
var SpatialMergeView = require('./spatial_merge_view');
var ChooseMergeMethod = require('./choose_merge_method_model');

/**
 * First step for a spatial merge - select a dataset table.
 */
module.exports = cdb.core.Model.extend({

  INSTRUCTIONS_SAFE_HTML: 'Calculate the intersecting geospatial records between two datasets (ex. points in polygons).<br/>' +
    "You'll need to decide the operation to perform here.",

  defaults: {
    user: undefined,
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
    this._initColumns();
    this._initLeftKeyColumn();
    this._initMergeMethods();
  },

  createView: function() {
    // Reset state
    this.set({
      gotoNextStep: false,
      rightTableData: undefined
    });
    this.get('mergeMethods').each(function(m) {
      m.set({
        selected: false,
        disabled: true
      });
    });
    this.get('rightColumns').reset();

    return new SpatialMergeView({
      model: this
    });
  },

  assertIfReadyForNextStep: function() {
    // Always return false, goes to next step implicitly on selecting table
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

  _initColumns: function() {
    var filteredLeftColumns = this._filterColumns(this.get('leftTable').get('schema'));
    this.set('leftColumns', new Backbone.Collection(filteredLeftColumns));
    this.set('rightColumns', new Backbone.Collection());
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
    this.set('gotoNextStep', true);
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
    icon: 'CDB-IconFont-play',
    title: 'Choose dataset to merge'
  },
  nextStep: ChooseMergeMethod
});
