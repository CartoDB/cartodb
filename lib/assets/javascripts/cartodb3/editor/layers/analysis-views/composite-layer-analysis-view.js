var cdb = require('cartodb-deep-insights.js');
var template = require('./composite-layer-analysis-view.tpl');
var LayerAnalysisDraggableHelperView = require('../layer-analysis-draggable-helper-view');
var LayerAnalysisView = require('../analysis-views/default-layer-analysis-view');
var RefLayerAnalysisView = require('../analysis-views/ref-layer-analysis-view');

/**
 * View for an analysis node which have two source nodes as input.
 *
 * this.model is expected to be a analysis-definition-node-nodel
 */
module.exports = cdb.core.View.extend({

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

    this._addPrimarySourceView();
    this._addSecondarySourceView();

    this.draggableHelperView = new LayerAnalysisDraggableHelperView({
      el: this.el
    });

    this.addView(this.draggableHelperView);
    this.draggableHelperView.bind('dropped', this._onDropped, this);

    return this;
  },

  _addPrimarySourceView: function () {
    var view = new LayerAnalysisView({
      model: this.model,
      layerDefinitionModel: this._layerDefinitionModel,
      analysisDefinitionNodesCollection: this._analysisDefinitionNodesCollection,
      isDraggable: false
    });

    this.addView(view);
    this.$('.js-primary-source').append(view.render().el);
  },

  _addSecondarySourceView: function () {
    var sourceIds = this.model.sourceIds();
    var secondarySourceModel = this._analysisDefinitionNodesCollection.get(sourceIds[1]);
    var otherModel = this._layerDefinitionModel.collection.find(function (m) {
      return m.hasAnalysisNode(secondarySourceModel);
    });

    var view = new RefLayerAnalysisView({
      model: otherModel,
      layerDefinitionModel: this._layerDefinitionModel,
      isDraggable: false
    });

    this.addView(view);
    this.$('.js-secondary-source').append(view.render().el);
  },

  _onDropped: function () {
    console.log('TODO: creates a new layer from ' + this.model.toJSON()); // TODO: replace with actual layer generation
  }

});
