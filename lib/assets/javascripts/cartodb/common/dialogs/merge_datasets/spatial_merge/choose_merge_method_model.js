var cdb = require('cartodb.js-v3');
var SpatialMergeView = require('./spatial_merge_view');
var MergeModel = require('../merge_step_model');
var generateSpatialMergeSQL = require('./generate_spatial_merge_sql');

/**
 * Step 2 for a spatial merge, select merge method and right column.
 */
module.exports = cdb.core.Model.extend({

  INSTRUCTIONS_SAFE_HTML: 'Calculate the intersecting geospatial records between two datasets (ex. points in polygons).<br/>' +
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
    rightColumns: undefined
  },

  createView: function() {
    // Reset state
    this.set('gotoNextStep', false);
    this.get('mergeMethods').each(function(m) {
      m.set('disabled', !this.isCountMergeMethod(m));
    }, this);
    this.get('rightColumns').comparator = function(column) {
      return column.get('name'); // sort alphabetically
    };

    return new SpatialMergeView({
      model: this
    });
  },

  selectedMergeMethod: function() {
    return this.get('mergeMethods').find(this._isSelectedColumn);
  },

  selectedRightMergeColumn: function() {
    return this.get('rightColumns').find(this._isSelectedColumn);
  },

  changedRightMergeColumn: function(newColumn) {
    this._updateMergeMethods(newColumn);
    this._assertIfReadyForNextStep();
  },

  changedSelectedMergeMethod: function(newMergeMethod) {
    var c = this.get('mergeMethods').chain().without(newMergeMethod);
    c.each(this._deselect); //all but the new selected merge method

    if (this.isCountMergeMethod(newMergeMethod)) {
      c.each(this._enable); //enable all, so the user can "go back" to see available columns for AVG/SUM merge methods
      this.get('rightColumns').each(this._deselect); // reset prev selection if any
    } else {
      // If not a count mege method update state based on current selection of merge column.
      this._updateMergeMethods(this.selectedRightMergeColumn());
    }

    this._assertIfReadyForNextStep();
  },

  _updateMergeMethods: function(newColumn) {
    // Each merge method should know how it should render based on selected merge column
    this.get('mergeMethods').each(function(m) {
      m.changedMergeColumn(newColumn);
    });
  },

  isCountMergeMethod: function(m) {
    return m && m.NAME === 'count';
  },

  nextStep: function() {
    return new this.constructor.nextStep({
      user: this.get('user'),
      tableName: this.get('leftTable').get('name'),
      sql: this._sqlForMergeMethod()
    });
  },

  _deselect: function(m) {
    m.set('selected', false);
  },

  _disable: function(m) {
    m.set('disabled', true);
  },

  _enable: function(m) {
    m.set('disabled', false);
  },

  _assertIfReadyForNextStep: function() {
    var mergeMethod = this.selectedMergeMethod();
    var isReady = mergeMethod && (
        this.isCountMergeMethod(mergeMethod) ||
        (!mergeMethod.get('disabled') && this.selectedRightMergeColumn())
      );
    this.set('isReadyForNextStep', isReady);
  },

  _sqlForMergeMethod: function() {
    var rightTableName = this.get('rightTableData').name;
    var mergeMethod = this.selectedMergeMethod();
    var selectedMergeColumn = this.selectedRightMergeColumn();
    var selectClause = mergeMethod.sqlSelectClause(rightTableName, selectedMergeColumn ? selectedMergeColumn.get('name') : '');

    return generateSpatialMergeSQL({
      leftTableName: this.get('leftTable').get('name'),
      leftColumnsNames: this._selectedLeftColumnsNames(),
      rightTableName: rightTableName,
      selectClause: selectClause,
      intersectType: mergeMethod.NAME
    });
  },

  _selectedLeftColumnsNames: function() {
    return this.get('leftColumns')
    .filter(this._isSelectedColumn)
    .map(function(m) {
      return m.get('name');
    });
  },

  _isSelectedColumn: function(m) {
    return m.get('selected');
  }

}, {
  header: {
    icon: 'CDB-IconFont-wizard',
    title: 'Choose merge columns'
  },
  nextStep: MergeModel
});
