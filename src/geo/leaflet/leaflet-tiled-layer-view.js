var _ = require('underscore');
var L = require('leaflet');
var LeafletLayerView = require('./leaflet-layer-view');

var LeafletTiledLayerView = L.TileLayer.extend({
  initialize: function(layerModel, leafletMap) {
    L.TileLayer.prototype.initialize.call(this, layerModel.get('urlTemplate'), {
      tms:          layerModel.get('tms'),
      attribution:  layerModel.get('attribution'),
      minZoom:      layerModel.get('minZoom'),
      maxZoom:      layerModel.get('maxZoom'),
      subdomains:   layerModel.get('subdomains') || 'abc',
      errorTileUrl: layerModel.get('errorTileUrl'),
      opacity:      layerModel.get('opacity')
    });
    LeafletLayerView.call(this, layerModel, this, leafletMap);
  },

  onAdd: function (map) {
    L.TileLayer.prototype.onAdd.call(this, map);

    var container = this.getContainer();
    // Disable mouse events for the container of this layer so that
    // events are not captured and other layers below can respond to mouse
    // events
    container.style.pointerEvents = 'none';
  }
});

_.extend(LeafletTiledLayerView.prototype, LeafletLayerView.prototype, {

  _modelUpdated: function() {
    _.defaults(this.leafletLayer.options, _.clone(this.model.attributes));
    this.leafletLayer.options.subdomains = this.model.get('subdomains') || 'abc';
    this.leafletLayer.options.attribution = this.model.get('attribution');
    this.leafletLayer.options.maxZoom = this.model.get('maxZoom');
    this.leafletLayer.options.minZoom = this.model.get('minZoom');
    // set url and reload
    this.leafletLayer.setUrl(this.model.get('urlTemplate'));
  }

});

module.exports = LeafletTiledLayerView;
