var cdb = require('cartodb-deep-insights.js');

/**
 * View of analyses within a layer
 * this.model is the layer-definition-model
 */
module.exports = cdb.core.View.extend({

  tagName: 'ul',

  initialize: function (opts) {
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!opts.layerAnalysisViewFactory) throw new Error('layerAnalysisViewFactory is required');

    this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
    this._layerAnalysisViewFactory = opts.layerAnalysisViewFactory;
  },

  render: function () {
    this.clearSubViews();

    var sourceModel = this._analysisDefinitionNodesCollection.get(this.model.get('source'));
    this._renderNode(sourceModel);

    return this;
  },

  /**
   * @param {Object} current instance of a analysis-layer-node-model
   */
  _renderNode: function (current) {
    this._createNodeView(current);

    var next = this._analysisDefinitionNodesCollection.get(current.getPrimarySourceId());
    if (next && this.model.hasAnalysisNode(current)) {
      this._renderNode(next);
    }
  },

  _createNodeView: function (current) {
    var view = this._layerAnalysisViewFactory.createView(current, this.model);
    this.listenTo(view, 'nodeClicked', this._onNodeClicked);
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _onNodeClicked: function (nodeId) {
    this.trigger('nodeClicked', nodeId, this);
  }

});
