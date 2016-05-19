var template = require('./composite-layer-analysis-view.tpl');
var DefaultLayerAnalysisView = require('./default-layer-analysis-view');
var BaseLayerAnalysisView = require('./base-layer-analysis-view');
var RefLayerAnalysisView = require('./ref-layer-analysis-view');
var SourceLayerAnalysisView = require('./source-layer-analysis-view');

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
module.exports = BaseLayerAnalysisView.extend({
  options: {
    isDraggable: true
  },

  tagName: 'li',

  className: 'js-analysis Editor-ListAnalysis-item',

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.analysisNode) throw new Error('analysisNode is required');
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');

    this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._analysisNode = opts.analysisNode;

    this.model.on('change', this.render, this);
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template());

    this._renderOwnNode();
    this._renderSecondaryNode();

    if (this.options.isDraggable) {
      this._addDraggableHelper();
    }

    return this;
  },

  _renderOwnNode: function () {
    var view = new DefaultLayerAnalysisView({
      tagName: 'div',
      model: this.model,
      analysisNode: this._analysisNode,
      layerDefinitionModel: this._layerDefinitionModel,
      analysisDefinitionNodesCollection: this._analysisDefinitionNodesCollection,
      isDraggable: false
    });

    this.addView(view);
    this.$('.js-primary-source').append(view.render().el);
  },

  _renderSecondaryNode: function () {
    var secondarySourceModel = this.model.getSecondarySource();

    var layerDefModel = this._findSecondaryLayerDefinitionModel(secondarySourceModel);
    var view = layerDefModel && layerDefModel !== this._layerDefinitionModel
      ? this._createRefLayerNodeView(layerDefModel)
      : this._createSourceNodeView(secondarySourceModel);

    this.addView(view);
    this.$('.js-secondary-source').append(view.render().el);
  },

  _findSecondaryLayerDefinitionModel: function (secondarySourceModel) {
    return this._layerDefinitionModel.collection.find(function (m) {
      return m.isOwnerOfAnalysisNode(secondarySourceModel);
    });
  },

  _createSourceNodeView: function (secondarySourceModel) {
    return new SourceLayerAnalysisView({
      model: secondarySourceModel,
      layerDefinitionModel: this._layerDefinitionModel,
      showId: false,
      isDraggable: false
    });
  },

  _createRefLayerNodeView: function (otherLayerDefModel) {
    return new RefLayerAnalysisView({
      tagName: 'div',
      model: otherLayerDefModel,
      layerDefinitionModel: this._layerDefinitionModel,
      isDraggable: false
    });
  }

});
