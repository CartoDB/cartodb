var CoreView = require('backbone/core-view');
var template = require('./analyses-workflow.tpl');
var ListView = require('./analyses-workflow-list-view');
var ScrollView = require('../../../../components/scroll/scroll-view');

module.exports = CoreView.extend({

  events: {
    'click .js-delete': '_deleteAnalysis'
  },

  initialize: function (opts) {
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!opts.analysisFormsCollection) throw new Error('analysisFormsCollection is required');
    if (!opts.viewModel) throw new Error('viewModel is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
    this.analysisFormsCollection = opts.analysisFormsCollection;
    this.viewModel = opts.viewModel;
    this._layerDefinitionModel = opts.layerDefinitionModel;
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(this._html());
    this._renderAnalysesView();
    return this;
  },

  _html: function () {
    return template({
      canDelete: this._canDeleteSelectedNode(),
      deleteLabel: !this._nodeDefModel()
        ? _t('editor.layers.layer.cancel-delete-analysis')
        : _t('editor.layers.layer.delete'),
      selectedNodeId: this.viewModel.get('selectedNodeId'),
      layerAnalysisCount: this._layerDefinitionModel.getNumberOfAnalyses()
    });
  },

  _renderAnalysesView: function () {
    var self = this;
    var view = new ScrollView({
      type: 'horizontal',
      createContentView: function () {
        return new ListView({
          analysisDefinitionNodesCollection: self._analysisDefinitionNodesCollection,
          analysisFormsCollection: self.analysisFormsCollection,
          model: self.viewModel,
          layerId: self._layerDefinitionModel.id
        });
      }
    });

    this.$('.js-content').append(view.render().el);
    this.addView(view);
  },

  _deleteAnalysis: function () {
    if (this._canDeleteSelectedNode()) {
      this.analysisFormsCollection.deleteNode(this.viewModel.get('selectedNodeId'));
    }
  },

  _canDeleteSelectedNode: function () {
    var nodeDefModel = this._nodeDefModel();
    return !nodeDefModel || nodeDefModel.canBeDeletedByUser();
  },

  _nodeDefModel: function () {
    var nodeId = this.viewModel.get('selectedNodeId');
    return this._layerDefinitionModel.findAnalysisDefinitionNodeModel(nodeId);
  }

});
