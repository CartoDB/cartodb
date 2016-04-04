var _ = require('underscore');
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
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');

    this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
    this._layerDefinitionModel = opts.layerDefinitionModel;

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
      layerDefinitionModel: this._layerDefinitionModel,
      analysisDefinitionNodesCollection: this._analysisDefinitionNodesCollection,
      isDraggable: false
    });

    this.addView(view);
    this.$('.js-primary-source').append(view.render().el);
  },

  _renderSecondaryNode: function () {
    var secondarySourceModel = this._getSecondarySource(this.model);

    var otherLayerDefModel = this._getLayerDefinitionModel(secondarySourceModel);
    var view = otherLayerDefModel
      ? this._createRefLayerNodeView(otherLayerDefModel)
      : this._createSourceNodeView(secondarySourceModel);

    this.addView(view);
    this.$('.js-secondary-source').append(view.render().el);
  },

  _getLayerDefinitionModel: function (secondarySourceModel) {
    return this._layerDefinitionModel.collection.find(function (m) {
      return m.get('source') === secondarySourceModel.id;
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
  },

  _getSecondarySource: function (parent) {
    // Assumption: there are only 1-2 sources, so secondary is the one that's not the primary
    var primarySourceId = parent.getPrimarySourceId();
    var secondarySourceId = _.find(parent.sourceIds(), function (sourceId) {
      return sourceId !== primarySourceId;
    });
    return this._analysisDefinitionNodesCollection.get(secondarySourceId);
  }

});
