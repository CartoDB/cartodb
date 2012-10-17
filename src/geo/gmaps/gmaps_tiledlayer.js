
(function() {

// TILED LAYER
var GMapsTiledLayerView = function(layerModel, gmapsMap) {
  GMapsLayerView.call(this, layerModel, this, gmapsMap);
};

_.extend(
  GMapsTiledLayerView.prototype,
  GMapsLayerView.prototype,
  google.maps.ImageMapType.prototype, {

    getTileUrl: function(tile, zoom) {
      var y = tile.y;
      var tileRange = 1 << zoom;
      if (y < 0 || y  >= tileRange) {
        return null;
      }
      var x = tile.x;
      if (x < 0 || x >= tileRange) {
        x = (x % tileRange + tileRange) % tileRange;
      }
      if(this.layerModel.get('tms')) {
        y = tileRange - y - 1;
      }
      var urlPattern = this.layerModel.get('urlTemplate');
      return urlPattern
                  .replace("{x}",x)
                  .replace("{y}",y)
                  .replace("{z}",zoom);
    },

    tileSize: new google.maps.Size(256, 256),
    opacity: 1.0,
    isPng: true,
    maxZoom: 22,
    minZoom: 0,
    name: 'cartodb tiled layer'

});

cdb.geo.GMapsTiledLayerView = GMapsTiledLayerView;


})();
