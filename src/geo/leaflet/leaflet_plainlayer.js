
(function() {

if(typeof(L) == "undefined") 
  return;


var LeafLetPlainLayerView = L.TileLayer.extend({

  initialize: function(layerModel, leafletMap) {
    cdb.geo.LeafLetLayerView.call(this, layerModel, this, leafletMap);
  },

  _redrawTile: function (tile) {
    tile.style.backgroundColor = this.model.get('color');
  },

  _createTileProto: function () {
    var proto = this._divProto = L.DomUtil.create('div', 'leaflet-tile leaflet-tile-loaded');
    var tileSize = this.options.tileSize;
    proto.style.width = tileSize + 'px';
    proto.style.height = tileSize + 'px';
  },

  _loadTile: function (tile, tilePoint, zoom) { },

  _createTile: function () {
      var tile = this._divProto.cloneNode(false);
      //set options here
      tile.onselectstart = tile.onmousemove = L.Util.falseFn;
      this._redrawTile(tile);
      return tile;
  }

});

_.extend(LeafLetPlainLayerView.prototype, cdb.geo.LeafLetLayerView.prototype);

cdb.geo.LeafLetPlainLayerView = LeafLetPlainLayerView;

})();
