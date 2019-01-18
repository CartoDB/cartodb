/*
 ===========================================
 generic tool for polygon drawing over google maps map
 ===========================================

*/

if (typeof(google) !== 'undefined') {

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
      google.maps.event.addListener(this, ev, function(e) {
        e._latlng = [e.latLng.lat(), e.latLng.lng()];
        callback(e)
      });
    },
    geojson: function() {
      return cdb.geo.gmaps.PathView.getGeoJSON(this, 'Point');
    }
  }

);


function PolygonGMaps() {
  google.maps.Polygon.apply(this, arguments);
}


var gmapsPolyPrototype =  {
  bind: function(ev, callback) {
    google.maps.event.addListener(this, ev, function(e) {
      e._latlng = [e.latlng.lat, e.latlng.lng];
      callback(e)
    });
  },
  setPath: function(points) {
    google.maps.Polygon.prototype.setPath.call(this, _(points).map(function(p) {
      return new google.maps.LatLng(p[0], p[1]);
    })
    );
  },
  setVertex: function(index, latlng) {
    this.getPath().setAt(index, new google.maps.LatLng(latlng[0], latlng[1]));
  }
}
_.extend(PolygonGMaps.prototype,
  google.maps.Polygon.prototype, 
  gmapsPolyPrototype, {
    geojson: function() {
      return cdb.geo.gmaps.PathView.getGeoJSON(this, 'MultiPolygon');
    }
  }
);


function PolylineGMaps() { 
  google.maps.Polyline.apply(this, arguments); 
}
_.extend(PolylineGMaps.prototype,
  google.maps.Polyline.prototype, 
  gmapsPolyPrototype, {
    geojson: function() {
      return cdb.geo.gmaps.PathView.getGeoJSON(this, 'MultiLineString');
    }
  }
);
}


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
   var self = this;
   this.on(ev, function(e) {
     e._latlng = [self.getLatLng().lat,  self.getLatLng().lng];
     callback(e);
   });
  },

  setMap: function(map) {
    if(map) {
      this.addTo(map);
    } else {
      this.map.removeLayer(this);
    }
  },

  geojson: function() {
    return this.toGeoJSON().geometry;
  }

});


/** polygon and polyline shares prototype */
var PathPrototype = {
  initialize: function() {
    this._parent.prototype.initialize.apply(this, arguments);
    var opts = arguments[0] || {}
    if(opts.map) {
      this.map = opts.map;
      this.addTo(opts.map);
    }
    opts.stroke = opts.strokeOpacity > 0;
    opts.color = opts.strokeColor;
    opts.fill = opts.fillOpacity > 0;
    opts.weight = opts.strokeWeight;
    opts.opacity = opts.strokeOpacity;

    this.setStyle(opts);
  },

  bind: function(ev, callback) {
   this.on(ev, function(e) {
     e.latLng = e.latlng;
     callback(e);
   });
  },

  setVertex: function(index, latlng) {
    var ll = this.getLatLngs();
    ll[index] =  new L.LatLng(latlng[0], latlng[1]);
    this.setLatLngs(ll);
  },

  setPath: function(points) {
    var ll = _(points).map(function(p) {
      return new L.LatLng(p[0], p[1]);
    });
    this.setLatLngs(ll);
  },

  setMap: function(map) {
    if(map) {
      this.addTo(map);
    } else {
      this.map.removeLayer(this);
    }
  }

};

var PolygonLeaflet = L.Polygon.extend(PathPrototype).extend({
  _parent: L.Polygon,
  geojson: function() {
    // transform to multipolygon
    var geo = this.toGeoJSON().geometry;
    return {
      type: 'MultiPolygon',
      coordinates: [geo.coordinates]
    };
  }
});

var PolylineLeaflet = L.Polyline.extend(PathPrototype).extend({
  _parent: L.Polyline,
  geojson: function() {
    // transform to multipolygon
    var geo = this.toGeoJSON().geometry;
    return {
      type: 'MultiLineString',
      coordinates: [geo.coordinates]
    };
  }
});


var BaseDrawTool = cdb.core.View.extend({

  image:  {
    url: cdb.config.get('assets_url') + '/images/layout/edit_marker_icon.png',
    anchor: {x: 5, y: 5}
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

  image:  {
    url: cdb.config.get('assets_url') + '/images/layout/default_marker.png',
    anchor: {x: 11, y: 11}
  },

  initialize: function() {
    this.mapview = this.options.mapview;
    this.map = this.mapview.getNativeMap();
    this.marker = null;
    this._setObjects();

  },

  canFinish: function() {
    return this.marker != null;
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

    canFinish: function() {
      return this.vertex.length >= 3;
    },

    start: function() {
      this.mapview.unbind('click', this.add_vertex);
      this.mapview.bind('click', this.add_vertex);
      this.reset();
    },


    reset: function() {
        var self = this;
        if(this.feature !== undefined) {
            this.feature.setMap(null);
            delete this.feature;
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
      this.feature = new this.Polygon({
        path:[],
        fillColor: "white",
        fillOpacity: 0.4,
        strokeOpacity: 1.0,
        strokeColor: '#397DBA',
        strokeWeight: 4,
        clickable: false,
        map: this.map
      });
    },

    clean: function() {
      this.reset();
      this.mapview.unbind('click', this.add_vertex);
      this.feature.setMap(null);
      delete this.feature;
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
        this.feature.setPath(this.vertex);
        return marker;
    },

    add_vertex: function(e, latLng) {
        var marker = this._add_vertex(latLng);
        marker.bind("drag", function(e) {
          self.mapview.unbind('click', self.add_vertex);
          self.vertex[marker.index] = e._latlng;
          self.feature.setVertex(marker.index, e._latlng);
        });
        marker.bind("dragend", function(e) {
          self.feature.setVertex(marker.index, e._latlng);
          self.vertex[marker.index] = e._latlng;
          _.defer(function() {
            self.mapview.bind('click', self.add_vertex);
          });
        });
        var self = this;
    },

    getGeoJSON: function() {
      return this.feature.geojson();
    }

});

var PolylineDrawTool = PolygonDrawTool.extend({

    createOverlays: function() {
      // not shown
      this.feature = new this.Polyline({
        path:[],
        strokeOpacity: 1.0,
        strokeColor: '#397DBA',
        strokeWeight: 4,
        fillOpacity: 0.0,
        clickable: false,
        map: this.map
      });
    },

    canFinish: function() {
      return this.vertex.length >= 2;
    },
});

