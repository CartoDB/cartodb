var cdb = require('cartodb.js');

/**
 * View of analyses within a layer
 * this.model is the layer-definition-model
 */
module.exports = cdb.core.View.extend({

  tagName: 'ul',

  initialize: function (opts) {
    if (!opts.layerAnalysisViewFactory) throw new Error('layerAnalysisViewFactory is required');

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
    this.listenTo(view, 'nodeClicked', this._onNodeClicked);
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _onNodeClicked: function (nodeDefModel) {
    this.trigger('nodeClicked', nodeDefModel, this);
  }

});
