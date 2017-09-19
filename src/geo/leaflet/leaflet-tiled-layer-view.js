var _ = require('underscore');
var L = require('leaflet');
var LeafletLayerView = require('./leaflet-layer-view');

var generateLeafletLayerOptions = function (layerModel) {
  return {
    tms: !!layerModel.get('tms'),
    attribution: layerModel.get('attribution'),
    minZoom: layerModel.get('minZoom'),
    maxZoom: layerModel.get('maxZoom'),
    subdomains: layerModel.get('subdomains') || 'abc',
    errorTileUrl: layerModel.get('errorTileUrl'),
    opacity: layerModel.get('opacity')
  };
};

var LeafletTiledLayerView = function (layerModel, leafletMap) {
  var self = this;
  LeafletLayerView.apply(this, arguments);

  this.leafletLayer.on('load', function (e) {
    self.trigger('load');
  });

  this.leafletLayer.on('loading', function (e) {
    self.trigger('loading');
  });

  this.leafletLayer.onAdd = function (map) {
    L.TileLayer.prototype.onAdd.apply(this, arguments);
    self._onAdd();
  };
};

LeafletTiledLayerView.prototype = _.extend(
  {},
  LeafletLayerView.prototype,
  {
    _createLeafletLayer: function (layerModel) {
      return new L.TileLayer(layerModel.get('urlTemplate'), generateLeafletLayerOptions(layerModel));
    },

    _onAdd: function () {
      var container = this.leafletLayer.getContainer();
      // Disable mouse events for the container of this layer so that
      // events are not captured and other layers below can respond to mouse
      // events
      container.style.pointerEvents = 'none';
    },

    _modelUpdated: function () {
      L.Util.setOptions(this.leafletLayer, generateLeafletLayerOptions(this.model));
      this.leafletLayer.setUrl(this.model.get('urlTemplate'));
    }
  }
);

LeafletTiledLayerView.prototype.constructor = LeafletTiledLayerView;

module.exports = LeafletTiledLayerView;
