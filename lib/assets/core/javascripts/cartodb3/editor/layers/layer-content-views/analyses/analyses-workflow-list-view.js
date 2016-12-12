var CoreView = require('backbone/core-view');
var AnalysesWorkflowItemView = require('./analyses-workflow-item-view');
var template = require('./analyses-workflow-list.tpl');

module.exports = CoreView.extend({

  className: 'HorizontalBlockList u-tSpace',
  tagName: 'ul',

  initialize: function (opts) {
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!opts.analysisFormsCollection) throw new Error('analysisFormsCollection is required');
    if (!opts.model) throw new Error('model is required');
    if (!opts.layerId) throw new Error('layerId is required');

    this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
    this.analysis = opts.analysis;
    this.analysisFormsCollection = opts.analysisFormsCollection;
    this._layerId = opts.layerId;
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template({
      layerId: this._layerId
    }));

    this.analysisFormsCollection.each(this._renderWorkflowItem, this);
    return this;
  },

  _renderWorkflowItem: function (formModel) {
    var view = new AnalysesWorkflowItemView({
      analysisNode: this._analysisDefinitionNodesCollection.get(formModel.id),
      formModel: formModel,
      viewModel: this.model,
      layerId: this._layerId
    });
    this.$el.append(view.render().el);
    this.addView(view);
  }
});
