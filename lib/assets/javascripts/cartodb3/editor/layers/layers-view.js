var cdb = require('cartodb-deep-insights.js');
var DefaultLayerView = require('./layer-view');
var BasemapLayerView = require('./basemap-layer-view');

var DEFAULT_VIEW_TYPE = {
  createView: function (m) {
    return new DefaultLayerView({
      model: m
    });
  }
};

var LAYER_VIEW_TYPES = [
  {
    match: function (m) {
      return m.get('type') === 'Tiled' && m.get('order') === 0;
    },
    createView: function (m) {
      return new BasemapLayerView({
        model: m
      });
    }
  }
];

/**
 * View to render layer definitions overview
 */
module.exports = cdb.core.View.extend({
  className: 'BlockList',

  tagName: 'ul',

  initialize: function (opts) {
    if (!opts.layerDefinitionsCollection) throw new Error('layerDefinitionsCollection is required');

    this._layerDefinitionsCollection = opts.layerDefinitionsCollection;

    this.listenTo(this._layerDefinitionsCollection, 'add', this._addLayerView);
  },

  render: function () {
    this.clearSubViews();
    this._layerDefinitionsCollection.each(this._addLayerView, this);
    return this;
  },

  _addLayerView: function (m) {
    var item = LAYER_VIEW_TYPES.find(function (item) {
      return item.match(m);
    });
    item = item || DEFAULT_VIEW_TYPE;

    var view = item.createView(m);
    this.addView(view);
    this.$el.append(view.render().el);
  }
});
