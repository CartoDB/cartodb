var cdb = require('cartodb-deep-insights.js');
var template = require('./composite-layer-analysis-view.tpl');
var LayerAnalysisDraggableHelperView = require('../layer-analysis-draggable-helper-view');

/**
 * View for an analysis node which have two source nodes as input.
 *
 * this.model is expected to be a analysis-definition-node-nodel
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  className: 'js-analysis',

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!opts.layerAnalysisViewFactory) throw new Error('layerAnalysisViewFactory is required');

    this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._layerAnalysisViewFactory = opts.layerAnalysisViewFactory;

    this.model.on('change', this.render, this);
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template());

    var sourceIds = this.model.sourceIds();

    var sourceModelA = this._analysisDefinitionNodesCollection.get(sourceIds[0]);

    var view = this._layerAnalysisViewFactory.createView(sourceModelA, this._layerDefinitionModel);
    this.addView(view);
    this.$('.js-primary-source').append(view.render().el);

    var sourceModelB = this._analysisDefinitionNodesCollection.get(sourceIds[1]);

    view = this._layerAnalysisViewFactory.createView(sourceModelB, this._layerDefinitionModel);
    this.addView(view);
    this.$('.js-secondary-source').append(view.render().el);

    this.draggableHelperView = new LayerAnalysisDraggableHelperView({
      el: this.el
    });

    this.addView(this.draggableHelperView);
    this.draggableHelperView.bind('dropped', this._onDropped, this);

    return this;
  },

  _onDropped: function () {
    console.log('TODO: creates a new layer from ' + this.model.toJSON()); // TODO: replace with actual layer generation
  }

});
