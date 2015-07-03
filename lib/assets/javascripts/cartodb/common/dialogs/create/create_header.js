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
    this._initBinds();
  },

  render: function() {
    var d = {
      type: this.model.get('type'),
      option: this.model.getOption()
    };
    var template = cdb.templates.getTemplate('common/views/create/create_default_header');

    // Templated workflows!
    if (this.model.isTemplatedWorkflowStarted()) {
      var currentVisTemplate = this.model.getVisualizationTemplates().getSelectedTemplate();
      d.visTemplateSteps = _.pluck(currentVisTemplate.getSteps(), 'title');
      d.visTemplateStep = this.model.get('visualizationTemplateStep');
      d.visTemplateName = currentVisTemplate.get('name');
      template = cdb.templates.getTemplate('common/views/create/create_templated_workflows_header');
    }

    this.$el.html(template(d));
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:option change:visualizationTemplateStep', this.render, this);
  },

  _onClickBack: function() {
    if (this.model.get('option') !== "templates") {
      this.model.set('option', 'templates');
    }
  },

  _onClickTemplatedWorkflows: function() {
    this.model.set('visualizationTemplateStep', null)
  }

});