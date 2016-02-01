var _ = require('underscore-cdb-v3');
var Backbone = require('backbone-cdb-v3');
var cdb = require('cartodb.js-v3');
var ColumnMergeModel = require('./column_merge/column_merge_model');
var SpatialMergeModel = require('./spatial_merge/spatial_merge_model');

/**
 * View model for merge datasets view.
 */
module.exports = cdb.core.Model.extend({

  excludeColumns: [
    'cartodb_id',
    'created_at',
    'updated_at',
    'the_geom_webmercator',
    'cartodb_georef_status'
  ],

  defaults: {
    mergeFlavors: undefined, // Collection, created with model
    prevSteps: [],
    currentStep: undefined,
    table: undefined,
    user: undefined
  },

  initialize: function(attrs) {
    if (!attrs.table) throw new Error('table is required');
    if (!attrs.user) throw new Error('user is required');

    var data = {
      user: this.get('user'),
      table: this.get('table'),
      excludeColumns: this.excludeColumns
    };
    this.set('mergeFlavors', new Backbone.Collection([
      new ColumnMergeModel(data),
      new SpatialMergeModel(data)
    ]));
  },

  headerSteps: function() {
    var steps = [];

    var currentStep = this.get('currentStep');
    var firstStep = this.get('prevSteps')[0] || currentStep;
    var isFinished = true;
    if (firstStep) {
      var Model = firstStep.constructor;
      while (Model) {
        if (Model.header) {
          var isCurrent = Model === currentStep.constructor;
          if (isCurrent) {
            isFinished = false;
          }
          steps.push(
            _.extend({
              isFinished: isFinished,
              isCurrent: isCurrent
            }, Model.header)
          );
        }

        Model = Model === Model.nextStep ? undefined : Model.nextStep;
      }
    }

    return steps;
  },

  gotoNextStep: function() {
    var currentStep = this.get('currentStep');
    var nextStep = currentStep.nextStep();
    this.set({
      prevSteps: this.get('prevSteps').concat(currentStep),
      currentStep: nextStep
    });
  },

  gotoPrevStep: function() {
    this.set('currentStep', this.get('prevSteps').pop());
  }

});
