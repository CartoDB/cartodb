var CoreView = require('backbone/core-view');
var template = require('./analyses-workflow.tpl');
var ListView = require('./analyses-workflow-list-view');
var ScrollView = require('../../../../components/scroll/scroll-view');
var checkAndBuildOpts = require('../../../../helpers/required-opts');

var REQUIRED_OPTS = [
  'analysisDefinitionNodesCollection',
  'analysisFormsCollection',
  'viewModel',
  'layerDefinitionModel'
];

module.exports = CoreView.extend({

  events: {
    'click .js-delete': '_deleteAnalysis'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this.listenTo(this._analysisDefinitionNodesCollection, 'add', this.render);
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
      selectedNodeId: this._viewModel.get('selectedNodeId'),
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
          analysisFormsCollection: self._analysisFormsCollection,
          model: self._viewModel,
          layerId: self._layerDefinitionModel.id
        });
      }
    });

    this.$('.ie11-hotfix').append(view.render().el);
    this.addView(view);
  },

  _deleteAnalysis: function () {
    if (this._canDeleteSelectedNode()) {
      this._analysisFormsCollection.deleteNode(this._viewModel.get('selectedNodeId'));
    }
  },

  _canDeleteSelectedNode: function () {
    var nodeDefModel = this._nodeDefModel();
    return !nodeDefModel || nodeDefModel.canBeDeletedByUser();
  },

  _nodeDefModel: function () {
    var nodeId = this._viewModel.get('selectedNodeId');
    return this._layerDefinitionModel.findAnalysisDefinitionNodeModel(nodeId);
  }

});
