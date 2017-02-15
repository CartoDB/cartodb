var TC = require('tangram.cartodb');
var LeafletLayerView = require('./leaflet-layer-view');
var L = require('leaflet');

var LeafletCartoDBWebglLayerGroupView = L.Class.extend({
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

  onAdd: function () {},

  _onLayerAdded: function (layer, i) {
    var self = this;
    layer.bind('change:meta change:visible', function (e) {
      self.tangram.addLayer(e.attributes, (i + 1));
    });
  },

  setZIndex: function () {},

  _onURLsChanged: function (e, res) {
    var url = res.tiles[0]
      .replace('{layerIndexes}', 'mapnik')
      .replace('.png', '.mvt');

    this.tangram.addDataSource(url);
  }
});

module.exports = LeafletCartoDBWebglLayerGroupView;
