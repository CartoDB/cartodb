var _ = require('underscore');
var L = require('leaflet');
var TC = require('tangram.cartodb');
var LeafletLayerView = require('./leaflet-layer-view');

var LeafletCartoDBWebglLayerGroupView = function (layerGroupModel, leafletMap) {
  var self = this;
  LeafletLayerView.apply(this, arguments);

  this.tangram = new TC(leafletMap, function () {
    var onURLsChanged = self._onURLsChanged(layerGroupModel);

    layerGroupModel.bind('change:urls', onURLsChanged);

    layerGroupModel.forEachGroupedLayer(self._onLayerAdded, self);
    layerGroupModel.onLayerAdded(self._onLayerAdded.bind(self));
  });
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

      self.tangram.addLayer(layer.attributes, (i + 1));
    },

    _onURLsChanged: function (layerGroupModel) {
      var self = this;

      self.tangram.addDataSource(layerGroupModel.getTileURLTemplate('mvt'), layerGroupModel.getSubdomains());

      return function () {
        self.tangram.addDataSource(layerGroupModel.getTileURLTemplate('mvt'), layerGroupModel.getSubdomains());
      };
    }
  }
);

module.exports = LeafletCartoDBWebglLayerGroupView;
