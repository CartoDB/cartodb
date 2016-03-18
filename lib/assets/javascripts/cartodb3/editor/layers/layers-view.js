var _ = require('underscore');
var cdb = require('cartodb-deep-insights.js');
var DefaultLayerView = require('./layer-view');
var BasemapLayerView = require('./basemap-layer-view');
var LayerAnalysisViewFactory = require('./layer-analysis-view-factory');
var LayerAnalysisViews = require('./layer-analysis-views');

var DEFAULT_VIEW_TYPE = {
  createView: function (opts) {
    return new DefaultLayerView(opts);
  }
};

var LAYER_VIEW_TYPES = [
  {
    match: function (m) {
      return m.get('type') === 'Tiled' && m.get('order') === 0;
    },
    createView: function (opts) {
      return new BasemapLayerView(opts);
    }
  }
];

/**
 * View to render layer definitions list
 */
module.exports = cdb.core.View.extend({
  className: 'BlockList',

  tagName: 'ul',

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
    var item = _.find(LAYER_VIEW_TYPES, function (item) {
      return item.match(m);
    });

    item = item || DEFAULT_VIEW_TYPE;

    var view = item.createView({
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
