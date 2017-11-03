var CoreView = require('backbone/core-view');
var LayerAnalysisDraggableView = require('./layer-analysis-draggable-view');

/**
 * View of analyses within a layer
 * this.model is the layer-definition-model
 */
module.exports = CoreView.extend({

  tagName: 'ul',

  options: {
    sortableSelector: ''
  },

  initialize: function (opts) {
    if (!this.options.sortableSelector) throw new Error('sortableSelector is required');
    if (!opts.layerAnalysisViewFactory) throw new Error('layerAnalysisViewFactory is required');
    if (!this.model) throw new Error('layerDefinitionModel is required');

    this._layerAnalysisViewFactory = opts.layerAnalysisViewFactory;
  },

  render: function () {
    this.clearSubViews();

    var nodeDefModel = this.model.getAnalysisDefinitionNodeModel();
    this._renderNode(nodeDefModel);

    return this;
  },

  /**
   * @param {Object} current instance of a analysis-layer-node-model
   */
  _renderNode: function (current) {
    this._createNodeView(current);

    var next = current.getPrimarySource();
    if (next && this.model.isOwnerOfAnalysisNode(current)) {
      this._renderNode(next);
    }
  },

  _createNodeView: function (current) {
    var view = this._layerAnalysisViewFactory.createView(current, this.model);
    this.addView(view);
    this.$el.append(view.render().el);
    this._attachDraggableToNodeView(view, current);
  },

  _attachDraggableToNodeView: function (nodeView, nodeDefModel) {
    if (!this.model.isOwnerOfAnalysisNode(nodeDefModel)) return;

    var draggableView = new LayerAnalysisDraggableView({
      model: nodeDefModel,
      layerDefinitionModel: this.model,
      getNextLetter: this.model.collection.nextLetter.bind(this.model.collection),
      $nodeViewElement: nodeView.$el,
      sortableSelector: this.options.sortableSelector
    });
    this.addView(draggableView);
  }

});
