var cdb = require('cartodb.js');
var AnalysesWorkflowItemView = require('./analyses-workflow-item-view');
var template = require('./analyses-workflow.tpl');

module.exports = cdb.core.View.extend({

  events: {
    'click .js-delete': '_deleteAnalysis'
  },

  initialize: function (opts) {
    if (!opts.analysis) throw new Error('analysis is required');
    if (!opts.analysisFormsCollection) throw new Error('analysisFormsCollection is required');
    if (!opts.viewModel) throw new Error('viewModel is required');
    if (!opts.layerId) throw new Error('layerId is required');

    this.analysis = opts.analysis;
    this.analysisFormsCollection = opts.analysisFormsCollection;
    this.viewModel = opts.viewModel;
    this._layerId = opts.layerId;
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(this._html());

    this.analysisFormsCollection.each(this._renderWorkflowItem, this);

    return this;
  },

  _html: function () {
    return template({
      layerId: this._layerId,
      selectedNodeId: this.viewModel.get('selectedNodeId')
    });
  },

  _renderWorkflowItem: function (formModel) {
    var view = new AnalysesWorkflowItemView({
      analysisNode: this.analysis.findNodeById(formModel.id),
      formModel: formModel,
      viewModel: this.viewModel,
      layerId: this._layerId
    });
    this.$('.js-list').append(view.render().el);
    this.addView(view);
  },

  _deleteAnalysis: function () {
    this.analysisFormsCollection.deleteNode(this.viewModel.get('selectedNodeId'));
  }

});
