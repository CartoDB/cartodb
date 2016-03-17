var cdb = require('cartodb-deep-insights.js');
var LayerAnalysisViewFactory = require('./layer-analysis-view-factory');
var LayerAnalysisViews = require('./layer-analysis-views');
var DefaultLayerView = require('./layer-view');
var BasemapLayerView = require('./basemap-layer-view');

/**
 * View to render layer definitions list
 */
module.exports = cdb.core.View.extend({

  tagName: 'ul',
  className: 'BlockList',

  initialize: function (opts) {
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');

    this._stackLayoutModel = opts.stackLayoutModel;
    this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;

    this._layerAnalysisViewFactory = new LayerAnalysisViewFactory(
      this._analysisDefinitionNodesCollection,
      this._layerDefinitionsCollection
    );

    this.listenTo(this._layerDefinitionsCollection, 'add', this._addLayerView);
  },

  render: function () {
    this.clearSubViews();
    this._layerDefinitionsCollection.each(this._addLayerView, this);
    return this;
  },

  _addLayerView: function (m) {
    var LayerView = m.get('order') === 0
      ? BasemapLayerView
      : DefaultLayerView;

    var view = new LayerView({
      model: m,
      newAnalysisViews: this._newAnalysisViews.bind(this),
      stackLayoutModel: this._stackLayoutModel
    });

    this.addView(view);
    this.$el.append(view.render().el);
  },

  /**
   * As defined by default-layer-view
   */
  _newAnalysisViews: function (el, layerDefinitionModel) {
    return new LayerAnalysisViews({
      el: el,
      model: layerDefinitionModel,
      analysisDefinitionNodesCollection: this._analysisDefinitionNodesCollection,
      layerAnalysisViewFactory: this._layerAnalysisViewFactory
    });
  }
});
