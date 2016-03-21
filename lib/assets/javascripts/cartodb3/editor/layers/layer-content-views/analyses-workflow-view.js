var cdb = require('cartodb-deep-insights.js');
var AnalysesWorkflowItemView = require('./analyses-workflow-item-view');
var template = require('./analyses-workflow.tpl');

module.exports = cdb.core.View.extend({

  events: {
    'click .js-delete': '_deleteAnalysis',
    'click .js-newAnalysis': '_onNewAnalysisClick'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('Layer definition is required');
    if (!opts.analysisDefinitonsCollection) throw new Error('analysisDefinitonsCollection is required');
    if (!opts.viewModel) throw new Error('viewModel is required');
    this.layerDefinitionModel = opts.layerDefinitionModel;
    this.analysisDefinitonsCollection = opts.analysisDefinitonsCollection;
    this.analysisDefinitionNodesCollection = opts.analysisDefinitonsCollection.analysisDefinitionNodesCollection;
    this.viewModel = opts.viewModel;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.$el.append(
      template({
        selectedNodeId: this.viewModel.get('selectedNodeId')
      })
    );
    var sourceId = this.layerDefinitionModel.get('source');
    var sourceModel = this.analysisDefinitionNodesCollection.get(sourceId);
    this._renderNode(sourceModel);
    return this;
  },

  _renderNode: function (currentNode) {
    if (currentNode.get('type') === 'source') {
      return;
    }

    var currentNodeId = this.viewModel.get('selectedNodeId');
    var nodeView = new AnalysesWorkflowItemView({
      nodeModel: currentNode,
      selected: currentNodeId === currentNode.get('id')
    });
    nodeView.bind('nodeSelected', function (selectedNode, view) {
      var currentNodeId = this.viewModel.get('selectedNodeId');
      var selectedNodeId = selectedNode.get('id');
      if (currentNodeId !== selectedNodeId) {
        this.viewModel.set('selectedNodeId', selectedNodeId);
      }
    }, this);
    this.$('.js-list').append(nodeView.render().el);
    this.addView(nodeView);

    var nextId = currentNode.sourceIds()[0];
    var next = this.analysisDefinitionNodesCollection.get(nextId);

    if (next && this.layerDefinitionModel.hasAnalysisNode(currentNode)) {
      this._renderNode(next);
    }
  },

  _initBinds: function () {
    this.viewModel.bind('change:selectedNodeId', this.render, this);
    this.analysisDefinitionNodesCollection.bind('add remove', this.render, this);
    this.add_related_model(this.viewModel);
  },

  _deleteAnalysis: function () {
    console.log("Delete analysis button!");
  },

  _onNewAnalysisClick: function () {
    console.log("Add new analysis button!");
  }
});
