var _ = require('underscore');
var L = require('leaflet');
var LeafletLayerView = require('./leaflet-layer-view');

var LeafletTiledLayerView = function (layerModel, leafletMap) {
  var self = this;
  LeafletLayerView.apply(this, [layerModel, this._createLeafletLayer(layerModel), leafletMap]);

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
    setZIndex: function (index) {
      this.leafletLayer.setZIndex(index);
    },

    _createLeafletLayer: function (layerModel) {
      return new L.TileLayer(layerModel.get('urlTemplate'), {
        tms: !!layerModel.get('tms'),
        attribution: layerModel.get('attribution'),
        minZoom: layerModel.get('minZoom'),
        maxZoom: layerModel.get('maxZoom'),
        subdomains: layerModel.get('subdomains') || 'abc',
        errorTileUrl: layerModel.get('errorTileUrl'),
        opacity: layerModel.get('opacity')
      });
    },

    _onAdd: function () {
      var container = this.leafletLayer.getContainer();
      // Disable mouse events for the container of this layer so that
      // events are not captured and other layers below can respond to mouse
      // events
      container.style.pointerEvents = 'none';
    },

    _modelUpdated: function () {
      var model = this.model;
      var options = {
        subdomains: model.get('subdomains') || 'abc',
        attribution: model.get('attribution'),
        maxZoom: model.get('maxZoom'),
        minZoom: model.get('minZoom'),
        tms: !!model.get('tms')
      };

      L.Util.setOptions(this.leafletLayer, options);

      this.leafletLayer.setUrl(model.get('urlTemplate'));
    }
  }
);

LeafletTiledLayerView.prototype.constructor = LeafletTiledLayerView;

module.exports = LeafletTiledLayerView;