var cdb = require('cartodb.js');
var Backbone = require('backbone');
var SpatialMergeView = require('./spatial_merge_view');
var MergeModel = require('../merge_step_model');
var SumMergeMethod = require('./merge_methods/sum_merge_method');
var AVGMergeMethod = require('./merge_methods/avg_merge_method');
var CountMergeMethod = require('./merge_methods/count_merge_method');
var generateSpatialMergeSQL = require('./generate_spatial_merge_sql');


/**
 * Step 2 for a spatial merge, select columns to merge.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    instructions: 'Calculate the intersecting geospatial records between two datasets (ex. points in polygons).<br/>' +
      "You'll need to decide the operation to perform here.",

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

  initialize: function() {
    this.elder('initialize');
    this._initMergeMethods();
  },

  reset: function() {
    this.get('rightColumns').each(function(m) {
      m.set('disabled', m.get('type') !== 'number');
    });
  },

  createView: function() {
    return new SpatialMergeView({
      model: this
    });
  },

  assertIfReadyForNextStep: function() {
    var isReady = this._selectedMergeMethod().get('name') === 'count' || !!this._selectedRightMergeColumn();
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
      intersectType: mergeMethod.get('name')
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

  _initMergeMethods: function() {
    var mergeMethods = new Backbone.Collection([
      new SumMergeMethod({ selected: true }),
      new CountMergeMethod(),
      new AVGMergeMethod()
    ]);
    this.set('mergeMethods', mergeMethods);
  }

}, {
  header: {
    icon: 'iconFont-Wizard',
    title: 'Choose merge columns'
  },
  nextStep: MergeModel
});
