var cdb = require('cartodb.js');
var AnalysesWorkflowItemView = require('./analyses-workflow-item-view');
var template = require('./analyses-workflow.tpl');

module.exports = cdb.core.View.extend({

  events: {
    'click .js-delete': '_deleteAnalysis',
    'click .js-add-analysis': '_onAddAnalysisClick'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('Layer definition is required');
    if (!opts.viewModel) throw new Error('viewModel is required');
    if (!opts.openAddAnalysis) throw new Error('openAddAnalysis is required');
    if (!opts.analysis) throw new Error('analysis is required');

    this.layerDefinitionModel = opts.layerDefinitionModel;
    this.viewModel = opts.viewModel;
    this.openAddAnalysis = opts.openAddAnalysis;
    this.analysis = opts.analysis;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.$el.append(
      template({
        selectedNodeId: this.viewModel.get('selectedNode').id
      })
    );
    var currentNode = this.layerDefinitionModel.getAnalysisDefinitionNodeModel();
    this._renderNode(currentNode);
    return this;
  },

  _renderNode: function (currentNode) {
    var next = currentNode.getPrimarySource();
    if (next) {
      this._createNodeView(currentNode);

      if (this.layerDefinitionModel.isOwnerOfAnalysisNode(currentNode)) {
        this._renderNode(next);
      }
    }
  },

  _createNodeView: function (nodeModel) {
    var nodeView = new AnalysesWorkflowItemView({
      nodeModel: nodeModel,
      selected: nodeModel === this.viewModel.get('selectedNode'),
      analysisNode: this.analysis.findNodeById(nodeModel.id)
    });
    nodeView.bind('nodeSelected', function (selectedNode) {
      this.viewModel.set('selectedNode', selectedNode);
    }, this);
    this.$('.js-list').append(nodeView.render().el);
    this.addView(nodeView);
  },

  _initBinds: function () {
    this.viewModel.bind('change:selectedNode', this.render, this);
    this.add_related_model(this.viewModel);
  },

  _deleteAnalysis: function () {
    console.log('Delete analysis button!');
  },

  _onAddAnalysisClick: function () {
    this.openAddAnalysis();
  }
});
