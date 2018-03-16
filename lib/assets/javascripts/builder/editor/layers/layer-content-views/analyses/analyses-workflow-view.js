var CoreView = require('backbone/core-view');
var AnalysesWorkflowListView = require('./analyses-workflow-list-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'analysisDefinitionNodesCollection',
  'analysisFormsCollection',
  'layerDefinitionModel',
  'selectedNodeId'
];

module.exports = CoreView.extend({

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this.listenTo(this._analysisDefinitionNodesCollection, 'add', function () {
      // change:source happens when a node is deleted as well, so we can't just listen to it all the time
      this._layerDefinitionModel.once('change:source', this.render, this);
    });
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this._renderAnalysesView();

    return this;
  },

  _renderAnalysesView: function () {
    var self = this;

    var view = new AnalysesWorkflowListView({
      analysisDefinitionNodesCollection: self._analysisDefinitionNodesCollection,
      analysisFormsCollection: self._analysisFormsCollection,
      layerId: self._layerDefinitionModel.id,
      selectedNodeId: self._selectedNodeId
    });

    this.$el.append(view.render().el);
    this.addView(view);
  }
});
