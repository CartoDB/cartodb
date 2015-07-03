var cdb = require('cartodb.js');
var TemplatedWorkflowsFormView = require('./templated_workflows_form_view');
var TemplatedWorkflowsFormModel = require('./templated_workflows_form_model');


/**
 *
 *
 *
 *
 *
 */

module.exports = cdb.core.View.extend({

  className: '',

  initialize: function() {
    this.currentVisMapTemplate = null; // Current selected
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this._initViews();
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:visualizationTemplateStep', this.render, this);
  },

  _initViews: function() {
    var step = this.model.get('visualizationTemplateStep');

    // No step, no form
    if (step === null) {
      return false;
    }

    this.currentVisMapTemplate = this.collection.getSelectedTemplate();
    var stepData = this.currentVisMapTemplate.getStep(step);

    // Form
    var formModel = new TemplatedWorkflowsFormModel(null, stepData.forms);
    this.currentVisMapTemplate.setCurrentStepModel(formModel);

    var form = new TemplatedWorkflowsFormView({
      form_data: stepData.forms,
      model: formModel
    });
    
    this.$el.append(form.render().el);
    this.addView(form);
  }

});
