var cdb = require('cartodb.js');
var Backbone = require('backbone');
var SpatialMergeView = require('./spatial_merge_view');
var MergeModel = require('../merge_step_model');
var SumMergeMethod = require('./merge_methods/sum_merge_method');
var AVGMergeMethod = require('./merge_methods/avg_merge_method');
var CountMergeMethod = require('./merge_methods/count_merge_method');


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
    var selectedMergeMethod = this.get('mergeMethods').find(function(m) {
      return m.get('selected');
    });
    var isReady = selectedMergeMethod.get('name') === 'count' || !!this._selectedRightMergeColumn();
    this.set('isReadyForNextStep', isReady);
  },

  nextStep: function() {
    var sql; // TODO based on merge method method
    return new this.constructor.nextStep({
      user: undefined,
      tableName: this.get('leftTable').get('name'),
      sql: sql
    });
  },

  _selectedRightMergeColumn: function() {
    return this.get('rightColumns').find(function(column) {
      return column.get('selected');
    });
  },

  _initMergeMethods: function() {
    var mergeMethods = new Backbone.Collection([
      new SumMergeMethod({ selected: true }),
      new AVGMergeMethod(),
      new CountMergeMethod()
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
