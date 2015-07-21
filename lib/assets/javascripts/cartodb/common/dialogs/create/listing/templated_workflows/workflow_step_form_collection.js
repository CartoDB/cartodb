var cdb = require('cartodb.js');
var Backbone = require('backbone');
var WorkflowStepFieldModel = require('./workflow_step_field_model');

/**
 *  Workflows step form collection
 *
 *  - It will contain
 *  - Default model for templated workflows forms.
 *  - It will set its data from a 'formData' with setData function.
 *  
 */
module.exports = Backbone.Collection.extend({

  model: WorkflowStepFieldModel,

  initialize: function(models, formData) {
    this.validationError = '';
    // Validation?
    if (formData && formData.validate) {
      _.extend(this, { validate: formData.validate });
    }
  },

  toJSON: function() {
    var data = {};
    _.each(this.models, function(mdl){
      _.extend(data,mdl.toJSON())
    });
    return data;
  },

  validate: function(attrs) {
    return;
  },

  _validate: function() {
    // Check models validation
    var modelsValidation = true;

    this.each(function(mdl) {
      if (!mdl.isValid()) {
        modelsValidation = false  
      }
    });

    if (!modelsValidation) {
      this.validationError = '';
      return false;
    }

    // Check collection validation
    this.validationError = this.validate(this.toJSON());
    return !this.validationError;
  },

  isValid: function() {
    return this._validate();
  },

  getError: function() {
    return this.validationError;
  }

})