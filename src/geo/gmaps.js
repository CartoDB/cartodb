
// if google maps is not defined do not load the class
if(typeof(google) != "undefined" && typeof(google.maps) != "undefined") {

var DEFAULT_MAP_STYLE = [ { stylers: [ { saturation: -65 }, { gamma: 1.52 } ] },{ featureType: "administrative", stylers: [ { saturation: -95 }, { gamma: 2.26 } ] },{ featureType: "water", elementType: "labels", stylers: [ { visibility: "off" } ] },{ featureType: "administrative.locality", stylers: [ { visibility: "off" } ] },{ featureType: "road", stylers: [ { visibility: "simplified" }, { saturation: -99 }, { gamma: 2.22 } ] },{ featureType: "poi", elementType: "labels", stylers: [ { visibility: "off" } ] },{ featureType: "road.arterial", stylers: [ { visibility: "off" } ] },{ featureType: "road.local", elementType: "labels", stylers: [ { visibility: "off" } ] },{ featureType: "transit", stylers: [ { visibility: "off" } ] },{ featureType: "road", elementType: "labels", stylers: [ { visibility: "off" } ] },{ featureType: "poi", stylers: [ { saturation: -55 } ] } ];
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
    if(!this.isBase) {
      this.gmapsMap.overlayMapTypes.removeAt(this.index);
      this.model.unbind(null, null, this);
      this.unbind();
    }
  },

  refreshView: function() {
    //reset to update
    if(this.isBase) {
      var a = '_baseLayer';
      this.gmapsMap.setMapTypeId(null);
      this.gmapsMap.mapTypes.set(a, this.gmapsLayer);
      this.gmapsMap.setMapTypeId(a);
    } else {
      this.gmapsMap.overlayMapTypes.setAt(this.index, this.gmapsLayer);
    }
  }

});


// gmaps base view, dummy
var GMapsBaseLayerView = function(layerModel, gmapsMap) { 
  GMapsLayerView.call(this, layerModel, null, gmapsMap);
};
_.extend(GMapsBaseLayerView.prototype, GMapsLayerView.prototype, {
  _update: function() {
    var m = this.model;
    var types = {
      "roadmap": google.maps.MapTypeId.ROADMAP,
      "satellite": google.maps.MapTypeId.SATELLITE,
      "terrain": google.maps.MapTypeId.TERRAIN
    };

    this.gmapsMap.setOptions({
      mapTypeId: types[m.get('base_type')]
    });

    this.gmapsMap.setOptions({ 
      styles: m.get('style') || DEFAULT_MAP_STYLE
    });
  },
  remove: function() { }
});

var GMapsPlainLayerView = function(layerModel, gmapsMap) {
  var layer = {
    tileSize: new google.maps.Size(256,256),
    maxZoom: 100,
    minZoom: 0,
    name:"plain layer",
    alt: "plain layer",
    getTile: function(coord, zoom, ownerDocument) {
      var div = document.createElement('div');
      div.style.width = this.tileSize.x;
      div.style.height = this.tileSize.y;
      div['background-color'] = this.color;
      return div;
    },
    color: layerModel.get('color')
  };
  GMapsLayerView.call(this, layerModel, layer, gmapsMap);
};

cdb.geo.GMapsPlainLayerView = GMapsPlainLayerView;

_.extend(GMapsPlainLayerView.prototype, GMapsLayerView.prototype, {
  _update: function() {
    this.gmapsLayer.color = this.model.get('color');
    google.maps.event.trigger(this.gmapsLayer, 'updated');
    this.refreshView();
  }
});




// TILED LAYER
var GMapsTiledLayerView = function(layerModel, gmapsMap) {
  var layer = this._getLayer(layerModel);
  GMapsLayerView.call(this, layerModel, layer, gmapsMap);
};

_.extend(GMapsTiledLayerView.prototype, GMapsLayerView.prototype, {

  _update: function() {
    gmapsLayer = this._getLayer(this.model);
    this.refreshView();
  },

  _getLayer: function(layerModel) {
    return new google.maps.ImageMapType({
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
        if(layerModel.get('tms')) {
          y = tileRange - y - 1;
        }
        var urlPattern = layerModel.get('urlTemplate');
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
      name: 'cartodb tiled layer' + Math.random()
    });
  }
});

cdb.geo.GMapsTiledLayerView = GMapsTiledLayerView;

/**
* gmaps cartodb layer
*/

var GMapsCartoDBLayerView = function(layerModel, gmapsMap) {
  var self = this;

  _.bindAll(this, 'featureOut', 'featureOver', 'featureClick');

  var opts = _.clone(layerModel.attributes);

  opts.map =  gmapsMap;

  var // preserve the user's callbacks
  _featureOver  = opts.featureOver,
  _featureOut   = opts.featureOut,
  _featureClick = opts.featureClick;

  opts.featureOver  = function() {
    _featureOver  && _featureOver.apply(this, arguments);
    self.featureOver  && self.featureOver.apply(this, arguments);
  };

  opts.featureOut  = function() {
    _featureOut  && _featureOut.apply(this, arguments);
    self.featureOut  && self.featureOut.apply(this, arguments);
  };

  opts.featureClick  = function() {
    _featureClick  && _featureClick.apply(this, arguments);
    self.featureClick  && self.featureClick.apply(opts, arguments);
  };

  layer = new cdb.geo.CartoDBLayerGMaps(opts);
  GMapsLayerView.call(this, layerModel, layer, gmapsMap);
};

cdb.geo.GMapsCartoDBLayerView = GMapsCartoDBLayerView;


_.extend(GMapsCartoDBLayerView.prototype, GMapsLayerView.prototype, {

  _update: function() {
    _.extend(this.gmapsLayer.opts, this.model.attributes);
    this.gmapsLayer.update();
    this.refreshView();
  },

  remove: function() {
    GMapsLayerView.prototype.remove.call(this);
    this.gmapsLayer.remove();
  },

  featureOver: function(e, latlon, pixelPos, data) {
    // dont pass gmaps LatLng
    this.trigger('featureOver', e, [latlon.lat(), latlon.lng()], pixelPos, data);
  },

  featureOut: function(e) {
    this.trigger('featureOut', e);
  },

  featureClick: function(e, latlon, pixelPos, data) {
    // dont pass leaflet lat/lon
    this.trigger('featureClick', e, [latlon.lat(), latlon.lng()], pixelPos, data);
  }

});

cdb.geo.GoogleMapsMapView = cdb.geo.MapView.extend({

  layerTypeMap: {
    "tiled": cdb.geo.GMapsTiledLayerView,
    "cartodb": cdb.geo.GMapsCartoDBLayerView,
    "plain": cdb.geo.GMapsPlainLayerView,
    "gmapsbase": GMapsBaseLayerView
  },

  initialize: function() {
    _.bindAll(this, '_ready');
    this._isReady = false;
    var self = this;

    cdb.geo.MapView.prototype.initialize.call(this);
    var center = this.map.get('center');
    this.map_googlemaps = new google.maps.Map(this.el, {
      center: new google.maps.LatLng(center[0], center[1]),
      zoom: this.map.get('zoom'),
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

    this.projector = new cdb.geo.CartoDBLayerGMaps.Projector(this.map_googlemaps);
    
    this.projector.draw = this._ready;

  },

  _ready: function() {
    this.projector.draw = function() {};
    this.trigger('ready');
    this._isReady = true;
    var bounds = this.map.getViewBounds();
    if(bounds) {
      this.showBounds(bounds);
    }
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
      var idx = _.keys(this.layers).length  - 1;
      var isBaseLayer = idx === 0 || (opts && opts.index === 0);
      // set base layer
      if(isBaseLayer) {
        var m = layer_view.model;
        if(m.get('type') == 'GMapsBase') {
          layer_view._update();
        } else {
          layer_view.isBase = true;
          layer_view._update();
        }
      } else {
        idx -= 1;
        self.map_googlemaps.overlayMapTypes.setAt(idx, layer_view.gmapsLayer);
      }
      layer_view.index = idx;
      this.trigger('newLayerView', layer_view, this);
    } else {
      cdb.log.error("layer type not supported");
    }
  },

  latLonToPixel: function(latlon) {
    return this.projector.latLngToPixel(new google.maps.LatLng(latlon[0], latlon[1]));
  },

  getSize: function() {
    return {
      x: this.$el.width(),
      y: this.$el.height()
    };
  },

  panBy: function(p) {
    var c = this.map.get('center');
    var pc = this.latLonToPixel(c);
    p.x += pc.x;
    p.y += pc.y;
    var ll = this.projector.pixelToLatLng(p);
    this.map.setCenter([ll.lat(), ll.lng()]);
  },

  getBounds: function() {
    var b = this.map_googlemaps.getBounds();
    var sw = b.getSouthWest();
    var ne = b.getNorthEast();
    return [
      [sw.lat(), sw.lng()],
      [ne.lat(), ne.lng()]
    ];
  },

  showBounds: function(bounds) {
    var sw = bounds[0];
    var ne = bounds[1];
    var southWest = new google.maps.LatLng(sw[0], sw[1]);
    var northEast = new google.maps.LatLng(ne[0], ne[1]);
    this.map_googlemaps.fitBounds(new google.maps.LatLngBounds(southWest, northEast));
  },

  setAutoSaveBounds: function() {
    var self = this;
    // save on change
    this.map.bind('change:center change:zoom', _.debounce(function() {
      if(self._isReady) {
        var b = self.getBounds();
        self.map.save({
          view_bounds_sw: b[0],
          view_bounds_ne: b[1]
        }, { silent: true });
      }
    }, 1000), this);
  }

});

}
