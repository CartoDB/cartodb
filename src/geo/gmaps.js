
// if google maps is not defined do not load the class
if(typeof(google) != "undefined" && typeof(google.maps) != "undefined") {

/**
* base layer for all leaflet layers
*/
var GMapsLayerView = function(layerModel, gmapsLayer, gmapsMap) {
  this.gmapsLayer = gmapsLayer;
  this.gmapsMap = gmapsMap;
  this.model = layerModel;
  this.model.bind('change', this._update, this);
};

_.extend(GMapsLayerView.prototype, Backbone.Events);
_.extend(GMapsLayerView.prototype, {

  /**
  * remove layer from the map and unbind events
  */
  remove: function() {
    this.gmapsMap.overlayMapTypes.removeAt(this.index);
    this.model.unbind(null, null, this);
    this.unbind();
  }

});

// TILED LAYER
var GMapsTiledLayerView = function(layerModel, gmapsMap) {
  var layer = new google.maps.ImageMapType({
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
      return this.urlPattern
                  .replace("{x}",x)
                  .replace("{y}",y)
                  .replace("{z}",zoom);
    },
    tileSize: new google.maps.Size(256, 256),
    opacity: 1.0,
    isPng: true,
    urlPattern: layerModel.get('urlTemplate')
  });
  GMapsLayerView.call(this, layerModel, layer, gmapsMap);
};

_.extend(GMapsTiledLayerView.prototype, GMapsLayerView.prototype, {
  _update: function() {
    this.layer.urlPattern = this.model.get('urlTemplate');
  }
});

cdb.geo.GMapsTiledLayerView = GMapsTiledLayerView;


cdb.geo.GoogleMapsMapView = cdb.geo.MapView.extend({

  layerTypeMap: {
    "tiled": cdb.geo.GMapsTiledLayerView
    //"cartodb": cdb.geo.GMapsCartoDBView,
    //"plain": cdb.geo.GMapsPlainLayerView
  },

  initialize: function() {
    var self = this;

    cdb.geo.MapView.prototype.initialize.call(this);
    var center = this.map.get('center');
    this.map_googlemaps = new google.maps.Map(this.el, {
      center: new google.maps.LatLng(center[0], center[1]),
      zoom: 2,
      minZoom: this.map.get('minZoom'),
      maxZoom: this.map.get('maxZoom'),
      disableDefaultUI: true,
      mapTypeControl:false,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    this._bindModel();
    this._addLayers();

    google.maps.event.addListener(this.map_googlemaps, 'center_changed', function() {
        var c = self.map_googlemaps.getCenter();
        self._setModelProperty({ center: [c.lat(), c.lng()] });
    });

    google.maps.event.addListener(this.map_googlemaps, 'zoom_changed', function() {
      self._setModelProperty({
        zoom: self.map_googlemaps.getZoom()
      });
    });

    this.map.layers.bind('add', this._addLayer, this);
    this.map.layers.bind('remove', this._removeLayer, this);
    this.map.layers.bind('reset', this._addLayers, this);

  },

  _setZoom: function(model, z) {
    this.map_googlemaps.setZoom(z);
  },

  _setCenter: function(model, center) {
    var c = new google.maps.LatLng(center[0], center[1]);
    this.map_googlemaps.setCenter(c);
  },

  _addLayer: function(layer, layers, opts) {
    var self = this;
    var lyr, layer_view;

    var layerClass = this.layerTypeMap[layer.get('type').toLowerCase()];

    if (layerClass) {
      layer_view = new layerClass(layer, this.map_googlemaps);
    } else {
      cdb.log.error("MAP: " + layer.get('type') + " can't be created");
    }

    this.layers[layer.cid] = layer_view;

    if (layer_view) {
      var idx = this.layers.length - 1;
      //var isBaseLayer = this.layers.length === 1 || (opts && opts.index === 0);
      //this.map_leaflet.addLayer(layer_view.leafletLayer, isBaseLayer);
      self.map_googlemaps.overlayMapTypes.setAt(idx, layer.layer);
      layer.index = idx;
      this.trigger('newLayerView', layer_view, this);
    } else {
      cdb.log.error("layer type not supported");
    }
  }

});

}
