var cdb = require('cartodb.js');
var SpatialMergeView = require('./spatial_merge_view');
var MergeModel = require('../merge_step_model');
var generateSpatialMergeSQL = require('./generate_spatial_merge_sql');


/**
 * Step 2 for a spatial merge, select merge method and right column.
 */
module.exports = cdb.core.Model.extend({

  instructions: 'Calculate the intersecting geospatial records between two datasets (ex. points in polygons).<br/>' +
    "You'll need to decide the operation to perform here.",

  defaults: {
    isReadyForNextStep: false,
    user: undefined,
    mergeMethods: undefined,
    leftTable: undefined,
    leftKeyColumn: undefined,
    leftColumns: undefined,
    rightTableData: undefined,
    rightKeyColumn: undefined,
    rightColumns: undefined,

    rightMergeColumn: undefined
  },

  createView: function() {
    // Reset state
    this.get('rightColumns').each(function(m) {
      m.set('disabled', m.get('type') !== 'number');
    });
    this.get('mergeMethods').each(function(m, i) {
      m.set({
        selected: i === 0, //select only if is first item, and unselect the rest
        disabled: false
      });
    });
    this.get('rightColumns').comparator = this._columnsSortComparator;

    return new SpatialMergeView({
      model: this
    });
  },

  deselectAllMergeMethodsExcept: function(exceptModel) {
    this.get('mergeMethods')
      .chain()
      .without(exceptModel)
      .each(function(m) {
        m.set('selected', false);
      });
  },

  assertIfReadyForNextStep: function() {
    var isReady = this._selectedMergeMethod().name === 'count' || !!this._selectedRightMergeColumn();
    this.set('isReadyForNextStep', isReady);
  },

  nextStep: function() {
    return new this.constructor.nextStep({
      user: this.get('user'),
      tableName: this.get('leftTable').get('name'),
      sql: this._sqlForMergeMethod()
    });
  },

  _sqlForMergeMethod: function() {
    var rightTableName = this.get('rightTableData').name;
    var mergeMethod = this._selectedMergeMethod();
    var selectedMergeColumn = this._selectedRightMergeColumn();
    var selectClause = mergeMethod.sqlSelectClause(rightTableName, selectedMergeColumn ? selectedMergeColumn.get('name') : '');

    return generateSpatialMergeSQL({
      leftTableName: this.get('leftTable').get('name'),
      leftColumnsNames: this._selectedLeftColumnsNames(),
      rightTableName: rightTableName,
      selectClause: selectClause,
      intersectType: mergeMethod.name
    });
  },

  _selectedLeftColumnsNames: function() {
    return this.get('leftColumns')
    .filter(this._isSelectedColumn)
    .map(function(m) {
      return m.get('name');
    });
  },

  _selectedRightMergeColumn: function() {
    return this.get('rightColumns').find(this._isSelectedColumn);
  },

  _selectedMergeMethod: function() {
    return this.get('mergeMethods').find(this._isSelectedColumn);
  },

  _isSelectedColumn: function(m) {
    return m.get('selected');
  },

  _columnsSortComparator: function(column) {
    var columnName = column.get('name');
    // sort by priority of selected, the_geom, and then the rest alphabetically
    return column.get('selected') ? '00000' : columnName;
  }

}, {
  header: {
    icon: 'iconFont-Wizard',
    title: 'Choose merge columns'
  },
  nextStep: MergeModel
});
