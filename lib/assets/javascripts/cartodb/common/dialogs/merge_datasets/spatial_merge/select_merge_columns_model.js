var cdb = require('cartodb.js');
var SpatialMergeView = require('./spatial_merge_view');
var MergeModel = require('../merge_step_model');

/**
 * Step 2 for a spatial merge, select columns to merge.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    instructions: 'Calculate the intersecting geospatial records between two datasets (ex. points in polygons).<br/>' +
      "You'll need to decide the operation to perform here.",

    isReadyForNextStep: false,
    user: undefined,
    mergeMethods: ['sum', 'count', 'avg'],
    selectedMergeMethod: 'sum', // preselect
    leftTable: undefined,
    leftKeyColumn: undefined,
    leftColumns: undefined,
    rightTableData: undefined,
    rightKeyColumn: undefined,
    rightColumns: undefined,

    rightMergeColumn: undefined
  },

  createView: function() {
    return new SpatialMergeView({
      model: this
    });
  },

  assertIfReadyForNextStep: function() {
    var isReady = this.get('selectedMergeMethod') === 'count' || !!this._selectedRightColumn();
    this.set('isReadyForNextStep', isReady);
  },

  nextStep: function() {
    var sql; // TBD
    return new this.constructor.nextStep({
      user: undefined,
      tableName: this.get('leftTable').get('name'),
      sql: sql
    });
  },

  _selectedRightColumn: function() {
    return this.get('rightColumns').find(function(column) {
      return column.get('selected');
    });
  }

}, {
  header: {
    icon: 'iconFont-Wizard',
    title: 'Choose merge columns'
  },
  nextStep: MergeModel
});
