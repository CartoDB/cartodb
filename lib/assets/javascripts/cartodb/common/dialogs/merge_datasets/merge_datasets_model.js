var _ = require('underscore');
var Backbone = require('backbone');
var cdb = require('cartodb.js');
var ColumnMergeModel = require('./column_merge/column_merge_model');
var SpatialMergeModel = require('./spatial_merge/spatial_merge_model');

/**
 * View model for merge datasets view.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    mergeFlavors: undefined, // Collection, created with model
    prevSteps: [],
    currentStep: undefined,
    table: undefined,
    filteredColumns: [
      'cartodb_id',
      'created_at',
      'updated_at',
      'the_geom_webmercator',
      'cartodb_georef_status'
    ]
  },

  initialize: function(attrs) {
    if (!attrs.table) throw new Error('table is required');
    this.elder('initialize');

    this.set('mergeFlavors', new Backbone.Collection([
      new ColumnMergeModel({
        table: this.get('table'),
        filteredColumns: this._filteredColumns()
      }),
      new SpatialMergeModel()
    ]));
    this.get('mergeFlavors').bind('change:selected', this._onChangeSelectedMergeFlavor, this);
  },

  allSteps: function() {
    var steps = [];

    var currentStep = this.get('currentStep');
    var firstStep = this.get('prevSteps')[0] || currentStep;
    if (firstStep) {
      var Model = firstStep.constructor;
      while (Model) {
        steps.push(
          _.extend({
            isCurrent: Model === currentStep.constructor
          }, Model.header)
        );
        Model = Model.nextStep;
      }
    }

    return steps;
  },

  isLastStep: function() {
    var currentStep = this.get('currentStep');
    return currentStep && currentStep.nextStep;
  },

  gotoNextStep: function() {
    if (this.isLastStep()) return;

    var currentStep = this.get('currentStep');
    var nextStep = currentStep.nextStep();
    this.set({
      prevSteps: this.get('prevSteps').concat(currentStep),
      currentStep: nextStep
    });
  },

  gotoPrevStep: function() {
    this.set('currentStep', this.get('prevSteps').pop());
  },

  merge: function(callbacks) {
    // TODO: extract actual merge from the view, for now fake error
    setTimeout(callbacks.error, 1000);
  },

  _onChangeSelectedMergeFlavor: function(model, wasSelected) {
    // Only change to next step if there's one selected
    if (wasSelected) {
      var firstStep = model.firstStep();
      this.set('currentStep', firstStep);

      // reset selected state silently, so if/when user goes back to start view can select again
      model.unset('selected');
    }
  },

  _filteredColumns: function() {
    var filteredColumns = this.get('filteredColumns');
    return _.chain(this.get('table').get('schema'))
      .reject(function(column) {
        return _.contains(filteredColumns, column[0]);
      })
      .map(function(column) {
        // TODO: why don't we have a table.columns() method that returns an collection to begin with?
        return {
          name: column[0],
          type: column[1]
        };
      })
      .compact()
      .value();
  }

});
