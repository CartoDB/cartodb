var _ = require('underscore');
var cdb = require('cartodb-deep-insights.js');
var DefaultLayerView = require('./layer-view');
var BasemapLayerView = require('./basemap-layer-view');
var LayerAnalysisViewFactory = require('./layer-analysis-view-factory');

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
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');
    if (!opts.analysisDefinitionsCollection) throw new Error('analysisDefinitionsCollection is required');
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;
    this._analysisDefinitionsCollection = opts.analysisDefinitionsCollection;
    this._stackLayoutModel = opts.stackLayoutModel;
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
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      layerAnalysisViewFactory: new LayerAnalysisViewFactory(this._analysisDefinitionsCollection, this._layerDefinitionsCollection),
      stackLayoutModel: this._stackLayoutModel
    });

    this.addView(view);
    this.$el.append(view.render().el);
  }
});
