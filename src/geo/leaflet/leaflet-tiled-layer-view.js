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
      return new L.TileLayer(_getUrlTemplate.call(this), _generateLeafletLayerOptions.call(this));
    },

    _onAdd: function () {
      var container = this.leafletLayer.getContainer();
      // Disable mouse events for the container of this layer so that
      // events are not captured and other layers below can respond to mouse
      // events
      container.style.pointerEvents = 'none';
    },

    _modelUpdated: function () {
      L.Util.setOptions(this.leafletLayer, _generateLeafletLayerOptions.call(this));
      this.leafletLayer.setUrl(_getUrlTemplate.call(this), this.model);
    },

    _isHdpi: function () {
      return window && window.devicePixelRatio && window.devicePixelRatio > 1;
    }
  }
);

LeafletTiledLayerView.prototype.constructor = LeafletTiledLayerView;

var _generateLeafletLayerOptions = function generateLeafletLayerOptions () {
  return {
    tms: !!this.model.get('tms'),
    attribution: this.model.get('attribution'),
    minZoom: this.model.get('minZoom'),
    maxZoom: this.model.get('maxZoom'),
    subdomains: this.model.get('subdomains') || 'abc',
    errorTileUrl: this.model.get('errorTileUrl'),
    opacity: this.model.get('opacity')
  };
};

var _getUrlTemplate = function getUrlTemplate () {
  var changedAttributes = this.model.changedAttributes();

  if (changedAttributes.urlTemplate) {
    if (changedAttributes.urlTemplate2x) {
      return this._isHdpi() ? this.model.get('urlTemplate2x') : this.model.get('urlTemplate');
    } else {
      this.model.unset('urlTemplate2x', { silent: true });
      return this.model.get('urlTemplate');
    }
  }

  return this.model.get('urlTemplate');
};

module.exports = LeafletTiledLayerView;
