/* global L */
var _ = require('underscore');
var LeafletLayerView = require('./leaflet-layer-view');

var LeafletTiledLayerView = function (layerModel, opts) {
  LeafletLayerView.apply(this, arguments);

  this.leafletLayer.on('load', function (e) {
    this.trigger('load');
  }.bind(this));

  this.leafletLayer.on('loading', function (e) {
    this.trigger('loading');
  }.bind(this));

  var self = this;
  this.leafletLayer.onAdd = function (map) {
    L.TileLayer.prototype.onAdd.apply(this, arguments);
    self._onAdd();
  };
};

LeafletTiledLayerView.prototype = _.extend(
  {},
  LeafletLayerView.prototype,
  {
    _createLeafletLayer: function () {
      return new L.TileLayer(_getUrlTemplate(this._isHdpi(), this.model), _generateLeafletLayerOptions(this.model));
    },

    _onAdd: function () {
      var container = this.leafletLayer.getContainer();
      // Disable mouse events for the container of this layer so that
      // events are not captured and other layers below can respond to mouse
      // events
      container.style.pointerEvents = 'none';
    },

    _modelUpdated: function () {
      L.Util.setOptions(this.leafletLayer, _generateLeafletLayerOptions(this.model));
      this.leafletLayer.setUrl(_getUrlTemplate(this._isHdpi(), this.model));
    },

    _isHdpi: function () {
      return window && window.devicePixelRatio && window.devicePixelRatio > 1;
    }
  }
);

LeafletTiledLayerView.prototype.constructor = LeafletTiledLayerView;

var _generateLeafletLayerOptions = function generateLeafletLayerOptions (layerModel) {
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

var _getUrlTemplate = function getUrlTemplate (isHdpi, layerModel) {
  var changedAttributes = layerModel.changedAttributes();

  if (changedAttributes.urlTemplate && !changedAttributes.urlTemplate2x) {
    layerModel.unset('urlTemplate2x', { silent: true });
  }

  return isHdpi && layerModel.get('urlTemplate2x')
    ? layerModel.get('urlTemplate2x')
    : layerModel.get('urlTemplate');
};

module.exports = LeafletTiledLayerView;
