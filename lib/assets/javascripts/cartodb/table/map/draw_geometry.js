/*
 ===========================================
 generic tool for polygon drawing over google maps map
 ===========================================

*/


function MarkerGMaps() {
  var opts = arguments[0]
  if(opts.position) {
    opts.position = new google.maps.LatLng(opts.position[0], opts.position[1]);
  }
  google.maps.Marker.apply(this, arguments);
}

_.extend(MarkerGMaps.prototype,
  google.maps.Marker.prototype, {
    bind: function(ev, callback) {
      google.maps.event.addListener(this, ev, callback);
    },
    geojson: function() {
      return cdb.geo.gmaps.PathView.getGeoJSON(this, 'Point');
    }
  }

);


function PolygonGMaps() {
  google.maps.Polygon.apply(this, arguments);
}

_.extend(PolygonGMaps.prototype,
  google.maps.Polygon.prototype, {
    bind: function(ev, callback) {
      google.maps.event.addListener(this, ev, callback);
    },
    setPath: function(points) {
      google.maps.Polygon.prototype.setPath.call(this, _(points).map(function(p) {
        return new google.maps.LatLng(p[0], p[1]);
      })
      );
    },
    geojson: function() {
      return cdb.geo.gmaps.PathView.getGeoJSON(this, 'Polygon');
    }
  }
);


function PolylineGMaps() { google.maps.Polygon.apply(this, arguments); }
_.extend(PolylineGMaps.prototype,
  PolygonGMaps, {
    geojson: function() {
      return cdb.geo.gmaps.PathView.getGeoJSON(this, 'Polyline');
    }
  }
);


var MarkerLeaflet = L.Marker.extend({

  initialize: function(opts) {
    if(opts.icon) {
      opts.icon = L.icon({
        iconUrl: opts.icon.url,
        iconAnchor: [opts.icon.anchor.x, opts.icon.anchor.y]
      })
    }
    if(opts.position) {
      opts.position = new L.LatLng(opts.position[0], opts.position[1]);
    }
    var args = [opts.position].concat(Array.prototype.slice.call(arguments));
    L.Marker.prototype.initialize.apply(this, args);
    var opts = arguments[0] || {}
    if(opts.map) {
      this.map = opts.map;
      this.addTo(opts.map);
    }
  },

  bind: function(ev, callback) {
    this.on(ev, callback);
  },

  setMap: function(map) {
    if(map) {
      this.addTo(map);
    } else {
      this.map.removeLayer(this);
    }
  },

  geojson: function() {
    return L.GeoJSON.toGeoJSON(this);
  }

});


/** polygon and polyline shares prototype */
var PathPrototype = {
  initialize: function() {
    L.Polygon.prototype.initialize.apply(this, arguments);
    var opts = arguments[0] || {}
    if(opts.map) {
      this.map = opts.map;
      this.addTo(opts.map);
    }
    opts.stroke = opts.strokeOpacity > 0;
    opts.color = opts.strokeColor;
    opts.fill = opts.fillOpacity > 0;
    this.setStyle(opts);
  },

  bind: function(ev, callback) {
   this.on(ev, function(e) {
     e.latLng = e.latlng;
     callback(e);
   });
  },

  setPath: function(p) {
    this.setLatLngs(p);
  },

  setMap: function(map) {
    if(map) {
      this.addTo(map);
    } else {
      this.map.removeLayer(this);
    }
  },

  geojson: function() {
    return L.GeoJSON.toGeoJSON(this);
  }
}

var PolygonLeaflet = L.Polygon.extend(PathPrototype);
var PolylineLeaflet = L.Polyline.extend(PathPrototype);


var BaseDrawTool = cdb.core.View.extend({

  image:  {
    url: '/assets/icons/default_marker.png',
    anchor: {x: 11, y: 11}
  },

  _setObjects: function() {
    if(this.mapview.map.get('provider') == 'googlemaps') {
      this.Marker = MarkerGMaps;
      this.Polygon = PolygonGMaps;
      this.Polyline = PolylineGMaps;
    } else {
      this.Marker = MarkerLeaflet;
      this.Polygon = PolygonLeaflet;
      this.Polyline = PolylineLeaflet;
    }
  }


});

var PointDrawTool = BaseDrawTool.extend({

  initialize: function() {
    this.mapview = this.options.mapview;
    this.map = this.mapview.getNativeMap();

    this._setObjects();

  },

  start: function() {
    this.mapview.bind('click', function(e, latlng) {
      this.marker = new this.Marker({
        position: latlng,
        map: this.map,
        icon: this.image,
        draggable: true,
        flat : true,
        raiseOnDrag: false
      });
      this.mapview.unbind('click', null, this);
    }, this);
  },

  clean: function() {
    this.marker && this.marker.setMap(null);
    this.mapview.unbind('click', null, this);
  },

  getGeoJSON: function() {
    return this.marker.geojson();
  }

});


var PolygonDrawTool = BaseDrawTool.extend({

    initialize: function() {
        _.bindAll(this, 'add_vertex', '_add_vertex');
        this.mapview = this.options.mapview;
        this.map = this.mapview.getNativeMap();

        this._setObjects();
        this.reset();

    },

    start: function() {
      this.mapview.unbind('click', this.add_vertex);
      this.mapview.bind('click', this.add_vertex);
      this.reset();
    },


    reset: function() {
        var self = this;
        if(this.polyline !== undefined) {
            this.polyline.setMap(null);
            delete this.polyline;
            this.polygon.setMap(null);
            delete this.polygon;
        }
        if(this.markers !== undefined) {
            _.each(this.markers, function(m) {
                m.setMap(null);
            });
        }
        this.markers = [];
        this.vertex = [];
        this.createOverlays();

    },

    createOverlays: function() {
      this.polyline = new this.Polygon({
        path:[],
        strokeOpacity: 1.0,
        strokeColor: '#4383BD',
        strokeWeight: 1,
        fillOpacity: 0.0,
        map: this.map
      });

      this.polygon = new this.Polygon({
        path:[],
        fillColor: "white",
        fillOpacity: 0.4,
        strokeWeight: 0,
        map: this.map
      });
    },

    clean: function() {
      this.reset();
      this.mapview.unbind('click', this.add_vertex);
      this.polygon.setMap(null);
      this.polyline.setMap(null);
      delete this.polyline;
      delete this.polygon;
    },

    _add_vertex: function(latLng) {
        var marker = new this.Marker({
          position: latLng,
          map: this.map,
          icon: this.image,
          draggable: true,
          flat : true,
          raiseOnDrag: false
        });

        marker.index = this.vertex.length;
        this.markers.push(marker);
        this.vertex.push(latLng);
        this.polyline.setPath(this.vertex);
        this.polygon.setPath(this.vertex);
        return marker;
    },

    add_vertex: function(e, latLng) {
        var marker = this._add_vertex(latLng);
        /*marker.bind("drag", function(e) {
          self.polyline.getPath().setAt(this.index, e.latLng);
        });
        marker.bind("dragend", function(e) {
          self.polygon.getPath().setAt(this.index, e.latLng);
        });*/
        var self = this;
    },

    getGeoJSON: function() {
      return this.polygon.geojson();
    }

});

var PolylineDrawTool = PolygonDrawTool.extend({

    createOverlays: function() {

      debugger;

      // not shown
      this.polyline = new this.Polygon({
        path:[],
        fillOpacity: 0.0,
        strokeWeight: 0,
        map: this.map
      });

      this.polygon = new this.Polyline({
        path:[],
        strokeOpacity: 1.0,
        strokeColor: '#4383BD',
        strokeWeight: 1,
        fillOpacity: 0.0,
        map: this.map
      });
    },
});

