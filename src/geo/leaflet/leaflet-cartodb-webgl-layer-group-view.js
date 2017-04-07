var _ = require('underscore');
var L = require('leaflet');
var TC = require('tangram.cartodb');
var LeafletLayerView = require('./leaflet-layer-view');

var LeafletCartoDBWebglLayerGroupView = function (layerGroupModel, leafletMap) {
  LeafletLayerView.apply(this, arguments);

  layerGroupModel.bind('change:urls',
    this._onURLsChanged(layerGroupModel)
  );

  this.tangram = new TC(leafletMap);

  layerGroupModel.forEachGroupedLayer(this._onLayerAdded, this);
  layerGroupModel.onLayerAdded(this._onLayerAdded.bind(this));
};

LeafletCartoDBWebglLayerGroupView.prototype = _.extend(
  {},
  LeafletLayerView.prototype,
  {
    _createLeafletLayer: function () {
      var leafletLayer = new L.Layer();
      leafletLayer.onAdd = function () {};
      leafletLayer.onRemove = function () {};
      leafletLayer.setZIndex = function () {};
      return leafletLayer;
    },

    _onLayerAdded: function (layer, i) {
      var self = this;
      layer.bind('change:meta change:visible', function (e) {
        self.tangram.addLayer(e.attributes, (i + 1));
      });
    },

    _onURLsChanged: function (layerGroupModel) {
      var self = this;
      return function () {
        self.tangram.addDataSource(layerGroupModel.getTileURLTemplate('mvt'), layerGroupModel.getSubdomains());
      };
    }
  }
);

module.exports = LeafletCartoDBWebglLayerGroupView;
