
(function() {

if(typeof(L) == "undefined")
  return;

var LeafLetWMSLayerView = L.TileLayer.WMS.extend({
  initialize: function(layerModel, leafletMap) {

    var tmpLayer = {
      attribution:  layerModel.get('attribution'),
      layers:       layerModel.get('layers'),
      format:       layerModel.get('format'),
      transparent:  layerModel.get('transparent'),
      minZoom:      layerModel.get('minZomm'),
      maxZoom:      layerModel.get('maxZoom'),
      subdomains:   layerModel.get('subdomains') || 'abc',
      errorTileUrl: layerModel.get('errorTileUrl'),
      opacity:      layerModel.get('opacity')
    };

    if ( layerModel.get('tileSize') ) {
      tmpLayer.tileSize = layerModel.get('tileSize');
    }

    if ( layerModel.get('zoomOffset') ) {
      tmpLayer.zoomOffset = layerModel.get('zoomOffset');
    }

    L.TileLayer.WMS.prototype.initialize.call(this, layerModel.get('urlTemplate'), tmpLayer);

    cdb.geo.LeafLetLayerView.call(this, layerModel, this, leafletMap);
  }

});

_.extend(LeafLetWMSLayerView.prototype, cdb.geo.LeafLetLayerView.prototype, {

  _modelUpdated: function() {
    _.defaults(this.leafletLayer.options, _.clone(this.model.attributes));
    this.leafletLayer.setUrl(this.model.get('urlTemplate'));
  }

});

cdb.geo.LeafLetWMSLayerView = LeafLetWMSLayerView;

})();
