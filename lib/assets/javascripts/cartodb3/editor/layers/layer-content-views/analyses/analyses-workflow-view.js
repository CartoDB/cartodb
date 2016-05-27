var cdb = require('cartodb.js');
var AnalysesWorkflowItemView = require('./analyses-workflow-item-view');
var template = require('./analyses-workflow.tpl');

module.exports = cdb.core.View.extend({

  events: {
    'click .js-delete': '_deleteAnalysis',
    'click .js-add-analysis': '_onAddAnalysisClick'
  },

  initialize: function (opts) {
    if (!opts.analysisFormsCollection) throw new Error('analysisFormsCollection is required');
    if (!opts.viewModel) throw new Error('viewModel is required');
    if (!opts.openAddAnalysis) throw new Error('openAddAnalysis is required');
    if (!opts.analysis) throw new Error('analysis is required');

    this.analysisFormsCollection = opts.analysisFormsCollection;
    this.viewModel = opts.viewModel;
    this.openAddAnalysis = opts.openAddAnalysis;
    this.analysis = opts.analysis;
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(this._html());

    this.analysisFormsCollection.each(this._renderWorkflowItem, this);

    return this;
  },

  _html: function () {
    return template({
      selectedNodeId: this.viewModel.get('selectedNodeId')
    });
  },

  _renderWorkflowItem: function (formModel) {
    var view = new AnalysesWorkflowItemView({
      analysisNode: this.analysis.findNodeById(formModel.id),
      formModel: formModel,
      viewModel: this.viewModel
    });
    this.$('.js-list').append(view.render().el);
    this.addView(view);
  },

  _deleteAnalysis: function () {
    var nodeId = this.viewModel.get('selectedNodeId');
    this.analysisFormsCollection.deleteNode(nodeId);
  },

  _onAddAnalysisClick: function () {
    this.openAddAnalysis();
  }

});
