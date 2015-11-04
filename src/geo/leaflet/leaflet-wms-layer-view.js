var _ = require('underscore');
var L = require('leaflet');
var LeafletLayerView = require('./leaflet-layer-view.js');

var LeafletWMSLayerView = L.TileLayer.WMS.extend({
  initialize: function(layerModel, leafletMap) {

    L.TileLayer.WMS.prototype.initialize.call(this, layerModel.get('urlTemplate'), {
      attribution:  layerModel.get('attribution'),
      layers:       layerModel.get('layers'),
      format:       layerModel.get('format'),
      transparent:  layerModel.get('transparent'),
      minZoom:      layerModel.get('minZomm'),
      maxZoom:      layerModel.get('maxZoom'),
      subdomains:   layerModel.get('subdomains') || 'abc',
      errorTileUrl: layerModel.get('errorTileUrl'),
      opacity:      layerModel.get('opacity')
    });

    LeafletLayerView.call(this, layerModel, this, leafletMap);
  }

});

_.extend(LeafletWMSLayerView.prototype, LeafletLayerView.prototype, {

  _modelUpdated: function() {
    _.defaults(this.leafletLayer.options, _.clone(this.model.attributes));
    this.leafletLayer.setUrl(this.model.get('urlTemplate'));
  }

});

module.exports = LeafletWMSLayerView;
