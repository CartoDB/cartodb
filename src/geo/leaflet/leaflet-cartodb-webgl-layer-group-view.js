var TC = require('tangram.cartodb');
var LeafletLayerView = require('./leaflet-layer-view');
var L = require('leaflet');

var LeafletCartoDBVectorLayerGroupView = L.Class.extend({
  includes: [
    LeafletLayerView.prototype
  ],

  options: {
    minZoom: 0,
    maxZoom: 28,
    tileSize: 256,
    zoomOffset: 0,
    tileBuffer: 50
  },

  events: {
    featureOver: null,
    featureOut: null,
    featureClick: null
  },

  initialize: function (layerGroupModel, map) {
    LeafletLayerView.call(this, layerGroupModel, this, map);
    layerGroupModel.bind('change:urls', this._onURLsChanged, this);

    this.tangram = new TC(map);

    layerGroupModel.each(this._onLayerAdded, this);
    layerGroupModel.onLayerAdded(this._onLayerAdded.bind(this));
  },

  onAdd: function (map) {
    L.Layer.prototype.onAdd.call(this, map);
  },

  _onLayerAdded: function (layer) {
    var self = this;
    layer.bind('change:meta', function (e) {
      self.tangram.addLayer(e.attributes);
    });
  },

  setZIndex: function (zIndex) {},

  _onURLsChanged: function (e, res) {
    this.tangram.addDataSource(res.tiles[0]);
  }
});

module.exports = LeafletCartoDBVectorLayerGroupView;
