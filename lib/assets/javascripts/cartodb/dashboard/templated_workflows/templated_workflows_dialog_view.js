var cdb = require('cartodb.js');
var BaseDialog = require('../../common/views/base_dialog/view');
var TemplatedWorkflowsModel = require('./templated_workflows_model');
var TemplatedWorkflowsView = require('./templated_workflows_view');

/**
 *  Templated workflow dialog
 *
 *  Let the user decide which visualization template use to create
 *  a new visualization.
 *
 */

module.exports = BaseDialog.extend({

  className: 'Dialog is-opening TemplatedWorkflowDialog',

  initialize: function() {
    this.elder('initialize');
    this.model = new TemplatedWorkflowsModel();
    this.template = cdb.templates.getTemplate('dashboard/templated_workflows/templated_workflows_dialog');
  },

  render: function() {
    BaseDialog.prototype.render.call(this);
    this.$('.content').addClass('Dialog-content--expanded');
    this._initViews();
    return this;
  },

  render_content: function() {
    return this.template();
  },

  _initViews: function() {
    // Templated workflows main view
    var templatedWorkflowsView = new TemplatedWorkflowsView({
      el: this.el,
      model: this.model
    });
    templatedWorkflowsView.render();
    this.addView(templatedWorkflowsView);
  }

});
