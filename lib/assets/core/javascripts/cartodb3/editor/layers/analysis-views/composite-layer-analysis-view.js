var CoreView = require('backbone/core-view');
var SourceLayerAnalysisView = require('./source-layer-analysis-view');
var DefaultLayerAnalysisView = require('./default-layer-analysis-view');
var template = require('./composite-layer-analysis-view.tpl');

/**
 * View for an analysis node which have two source nodes as input.
 * The primary source node is rendered separately, this view renders the own node + the secondary one.
 *  _____________         ___________________
 * |  own node  | ------ |  secondary node  |
 * |____________|        |__________________|
 *       |
 *  ________________
 * |  primary node  |
 * |________________|
 *
 * this.model is expected to be a analysis-definition-node-nodel
 */
module.exports = CoreView.extend({

  tagName: 'li',
  className: 'Editor-ListAnalysis-item',

  initialize: function (opts) {
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
    this._layerDefinitionModel = opts.layerDefinitionModel;
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template());

    this._renderOwnNode();
    this._renderSecondaryNode();

    return this;
  },

  _renderOwnNode: function () {
    var view = new DefaultLayerAnalysisView({
      tagName: 'div',
      model: this.model,
      analysisNode: this._analysisDefinitionNodesCollection.get(this.model.id),
      layerDefinitionModel: this._layerDefinitionModel
    });
    this.addView(view);
    this.$('.js-primary-source').append(view.render().el);
  },

  _renderSecondaryNode: function () {
    var nodeDefModel = this.model.getSecondarySource();
    var layerDefModel = this._layerDefinitionModel.collection.findOwnerOfAnalysisNode(nodeDefModel);

    if (nodeDefModel) {
      var view = nodeDefModel.get('type') === 'source'
        ? new SourceLayerAnalysisView({
          model: nodeDefModel,
          analysisNode: this._analysisDefinitionNodesCollection.get(nodeDefModel.id),
          layerDefinitionModel: this._layerDefinitionModel,
          showId: !!(layerDefModel && this._isOwnedByOtherLayer(layerDefModel))
        })
        : new DefaultLayerAnalysisView({
          tagName: 'div',
          model: nodeDefModel,
          analysisNode: this._analysisDefinitionNodesCollection.get(nodeDefModel.id),
          layerDefinitionModel: layerDefModel
        });

      this.addView(view);
      this.$('.js-secondary-source').append(view.render().el);
    }
  },

  _isOwnedByOtherLayer: function (layerDefModel) {
    return layerDefModel !== this._layerDefinitionModel;
  }

});
