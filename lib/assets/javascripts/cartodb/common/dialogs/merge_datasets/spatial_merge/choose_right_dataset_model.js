var cdb = require('cartodb.js');
var $ = require('jquery');
var _ = require('underscore');
var SpatialMergeView = require('./spatial_merge_view');
var SelectMergeColumns = require('./select_merge_columns_model');

/**
 * First step for a spatial merge - select a dataset table.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    instructions: 'Calculate the intersecting geospatial records between two datasets (ex. points in polygons).<br/>' +
      "You'll need to decide the operation to perform here.",

    goDirectlyToNextStep: false,
    leftTable: undefined,
    excludeColumns: undefined,
    leftKeyColumn: undefined,
    leftColumns: undefined,

    rightTableData: undefined,
    rightColumns: undefined
  },

  initialize: function(attrs) {
    if (!attrs.leftTable) throw new Error('leftTable is required');
    if (!attrs.excludeColumns || _.isEmpty(attrs.excludeColumns)) cdb.log.error('excludeColumns was empty');
    this.elder('initialize');
    this._initColumns();
    this._initLeftKeyColumn();
  },

  reset: function() {
    this.set({
      goDirectlyToNextStep: false,
      rightTableData: undefined
    });
  },

  createView: function() {
    return new SpatialMergeView({
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
      success: this._onFetchedRightColumns.bind(this)
    });
  },

  nextStep: function() {
    return new this.constructor.nextStep({
      leftTable      : this.get('leftTable'),
      leftKeyColumn  : this.get('leftKeyColumn'),
      leftColumns    : this.get('leftColumns'),
      rightTableData : this.get('rightTableData'),
      rightKeyColumn : this._rightKeyColumn(),
      rightColumns   : this.get('rightColumns')
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
    var theGeomColumn = this.get('leftColumns').find(function(column) {
      return column.get('name') === 'the_geom';
    });
    this.set('leftKeyColumn', theGeomColumn.clone());
  },

  _onFetchedRightColumns: function(results) {
    var filteredColumns = this._filterColumns(results.schema);
    this.get('rightColumns').reset(filteredColumns, { silent: true }); // handled in next step
    this.set('goDirectlyToNextStep', true);
  },

  _rightKeyColumn: function() {
    return this.get('rightColumns')
      .chain()
      .find(function(column) {
        return column.get('name') === 'the_geom';
      })
      .value()
      .clone();
  }

}, {
  header: {
    icon: 'iconFont-Play',
    title: 'Choose dataset to merge'
  },
  nextStep: SelectMergeColumns
});
