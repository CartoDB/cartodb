// require('d3.cartodb');// TODO: The 'd3.cartodb' module doens't currently export L.CartoDBd3Layer
// and it's currently relying on window.L so weed to do the following trick.
// Check out: https://github.com/CartoDB/d3.cartodb/issues/93 for more info
// var CartoDBd3Layer = window.L.CartoDBd3Layer;
var TC = require('tangram.cartodb');
var LeafletLayerView = require('./leaflet-layer-view');
var GeoJSONDataProvider = require('../data-providers/geojson/data-provider');

var LeafletCartoDBVectorLayerGroupView = L.TileLayer.extend({
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

  },

  _onLayerAdded: function (layer) {
    var self = this;
    layer.bind('change:meta', function (e) {
      self.tangram.addLayer(e.attributes);
    });
  },

  _onURLsChanged: function (e, res) {
    this.tangram.addDataSource(res.tiles[0]);
  }
});

module.exports = LeafletCartoDBVectorLayerGroupView;
