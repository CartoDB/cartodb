var _ = require('underscore');
var L = require('leaflet');
var TC = require('tangram.cartodb');
var LeafletLayerView = require('./leaflet-layer-view');

var LeafletCartoDBWebglLayerGroupView = function (layerGroupModel, leafletMap) {
  var self = this;
  LeafletLayerView.apply(this, arguments);

  this.tangram = new TC(leafletMap, this.initConfig.bind(this, layerGroupModel));
};

LeafletCartoDBWebglLayerGroupView.prototype = _.extend(
  {},
  LeafletLayerView.prototype,
  {
    initConfig: function (layerGroupModel) {
      var onURLsChanged = this._onURLsChanged(layerGroupModel);

      layerGroupModel.bind('change:urls', onURLsChanged);

      layerGroupModel.forEachGroupedLayer(this._onLayerAdded, this);
      layerGroupModel.onLayerAdded(this._onLayerAdded.bind(this));
    },
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
