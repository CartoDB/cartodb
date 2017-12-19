/* global L */
var _ = require('underscore');
var LeafletLayerView = require('./leaflet-layer-view.js');

var generateLeafletLayerOptions = function (layerModel) {
  return {
    attribution: layerModel.get('attribution'),
    layers: layerModel.get('layers'),
    format: layerModel.get('format'),
    transparent: layerModel.get('transparent'),
    minZoom: layerModel.get('minZomm'),
    maxZoom: layerModel.get('maxZoom'),
    subdomains: layerModel.get('subdomains') || 'abc',
    errorTileUrl: layerModel.get('errorTileUrl'),
    opacity: layerModel.get('opacity')
  };
};

var LeafletWMSLayerView = function (layerModel, opts) {
  LeafletLayerView.apply(this, arguments);

  this.leafletLayer.on('load', function (e) {
    this.trigger('load');
  }.bind(this));

  this.leafletLayer.on('loading', function (e) {
    this.trigger('loading');
  }.bind(this));
};

LeafletWMSLayerView.prototype = _.extend(
  {},
  LeafletLayerView.prototype,
  {
    _createLeafletLayer: function () {
      return new L.TileLayer.WMS(this.model.get('urlTemplate'), generateLeafletLayerOptions(this.model));
    },

    _modelUpdated: function () {
      L.Util.setOptions(this.leafletLayer, generateLeafletLayerOptions(this.model));
      this.leafletLayer.setUrl(this.model.get('urlTemplate'));
    }
  }
);

module.exports = LeafletWMSLayerView;
