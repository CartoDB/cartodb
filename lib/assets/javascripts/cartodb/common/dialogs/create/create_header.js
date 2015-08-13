var cdb = require('cartodb.js');

/**
 *  Create header view
 *
 *  It will manage which content should be displayed
 *  depending create model
 *
 */

module.exports = cdb.core.View.extend({

  events: {
    'click .js-back': '_onClickBack',
    'click .js-templates': '_onClickBack',
    'click .js-templatedWorkflows': '_onClickTemplatedWorkflows'
  },
  
  initialize: function() {
    this.user = this.options.user;
    if (this.model.isMapType()) {
      this.workflowModel = this.model.getWorkflowModel();
    }
    this._initBinds();
  },

  render: function() {
    var d = {
      type: this.model.get('type'),
      option: this.model.getOption()
    };
    var template = cdb.templates.getTemplate('common/views/create/create_default_header');

    // Templated workflows!
    if (this.model.get('listing') === "templated_workflows" && this.workflowModel && this.workflowModel.getStepNumber() !== null) {
      d.workflowStepNames = this.workflowModel.getStepNames();
      d.workflowStepNumber = this.workflowModel.getStepNumber();
      d.workflowName = this.workflowModel.getTemplateName();
      template = cdb.templates.getTemplate('common/views/create/create_templated_workflows_header');
    }

    this.$el.html(template(d));
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:option change:listing', this.render, this);
    if (this.model.isMapType()) {
      this.workflowModel.bind('change:stepNumber', this.render, this);
      this.add_related_model(this.workflowModel);
    }
  },

  _onClickBack: function() {
    if (this.model.get('option') !== "templates") {
      this.model.set('option', 'templates');
    }
  },

  _onClickTemplatedWorkflows: function() {
    this.workflowModel.resetValues();
  }

});