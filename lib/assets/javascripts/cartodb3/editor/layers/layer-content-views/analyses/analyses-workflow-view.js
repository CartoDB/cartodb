var CoreView = require('backbone/core-view');
var template = require('./analyses-workflow.tpl');
var ListView = require('./analyses-workflow-list-view');
var ScrollView = require('../../../../components/scroll/scroll-view');

module.exports = CoreView.extend({

  events: {
    'click .js-delete': '_deleteAnalysis'
  },

  initialize: function (opts) {
    if (!opts.analysis) throw new Error('analysis is required');
    if (!opts.analysisFormsCollection) throw new Error('analysisFormsCollection is required');
    if (!opts.viewModel) throw new Error('viewModel is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this.analysis = opts.analysis;
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
      selectedNodeId: this.viewModel.get('selectedNodeId')
    });
  },

  _renderAnalysesView: function () {
    var self = this;
    var view = new ScrollView({
      type: 'horizontal',
      createContentView: function () {
        return new ListView({
          analysis: self.analysis,
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
    var nodeId = this.viewModel.get('selectedNodeId');
    if (!nodeId) return false;

    var nodeDefModel = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(nodeId);
    if (!nodeDefModel) return false;

    return nodeDefModel.canBeDeletedByUser();
  }

});
