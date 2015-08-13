var cdb = require('cartodb.js');
var TemplatedWorkflowsFormView = require('./templated_workflows_form_view');

/**
 * Renders a new form after entering a new step
 * It gets the forms for the new step from the WorkflowModel and the template.
 * this.model is a WorkflowModel
 */
module.exports = cdb.core.View.extend({

  className: '',

  initialize: function() {
    this.user = this.options.user;
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this._initViews();
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:stepNumber', this.render, this);
  },

  _initViews: function() {
    var step = this.model.get('stepNumber');

    // No step, no form
    if (step === null) {
      return false;
    }

    // It will contain all field models
    var stepFormCollection = this.model.getStepFormCollection();
    var step = this.model.getStep(step);

    var form = new TemplatedWorkflowsFormView({
      form_description: step.description,
      form_data: step.forms,
      user: this.user,
      collection: stepFormCollection
    });
    
    this.$el.append(form.render().el);
    this.addView(form);
  }
});
