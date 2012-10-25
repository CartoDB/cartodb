(function() {
/**
 * view for markers
 */
function PointView(geometryModel) {
  var self = this;
  // events to link
  var events = [
    'click',
    'dblclick',
    'mousedown',
    'mouseover',
    'mouseout',
    'dragstart',
    'drag',
    'dragend'
  ];

  this._eventHandlers = {};
  this.model = geometryModel;
  this.points = [];

  var style = _.clone(geometryModel.get('style')) || {};
  style.path = google.maps.SymbolPath.CIRCLE;
  //style.scale = style.weight;
  //style.strokeColor = "ff0000";
  //style.strokeOpacity = 1;
  //style.strokeWeight = 1;
  //style.fillColor = '00000';
  //style.fillOpacity = 0.5;

  this.geom = new GeoJSON (
    geometryModel.get('geojson'),
    {
      icon: {
          url: '/assets/icons/default_marker.png',
          anchor: {x: 11, y: 11}
      }
    }
  );

  // bind events
  var i;
  for(i = 0; i < events.length; ++i) {
    var e = events[i];
    google.maps.event.addListener(this.geom, e, self._eventHandler(e));
  }

  // link dragging
  this.bind('dragend', function(e, pos) {
    geometryModel.set({
      geojson: {
        type: 'Point',
        // geojson is lng,lat
        coordinates: [pos[1], pos[0]]
      }
    });
  });
}

PointView.prototype = new GeometryView();

PointView.prototype._eventHandler = function(evtType) {
  var self = this;
  var h = this._eventHandlers[evtType];
  if(!h) {
    h = function(e) {
      var latlng = e.latLng;
      var s = [latlng.lat(), latlng.lng()];
      self.trigger(evtType, e, s);
    };
    this._eventHandlers[evtType] = h;
  }
  return h;
};

PointView.prototype.edit = function(enable) {
  this.geom.setDraggable(enable);
};

/**
 * view for other geometries (polygons/lines)
 */
function PathView(geometryModel) {
  var self = this;
  // events to link
  var events = [
    'click',
    'dblclick',
    'mousedown',
    'mouseover',
    'mouseout',
  ];

  this._eventHandlers = {};
  this.model = geometryModel;
  this.points = [];

  

  var style = _.clone(geometryModel.get('style')) || {};

  this.geom = new GeoJSON (
    geometryModel.get('geojson'),
    style
  );

  /*_.each(this.geom._layers, function(g) {
    g.setStyle(geometryModel.get('style'));
    g.on('edit', function() {
      geometryModel.set('geojson', L.GeoJSON.toGeoJSON(self.geom));
    }, self);
  });
  */

  _.bindAll(this, '_updateModel');
  var self = this;

  function bindPath(p) {
    google.maps.event.addListener(p, 'insert_at', self._updateModel);
    /*
    google.maps.event.addListener(p, 'remove_at', this._updateModel);
    google.maps.event.addListener(p, 'set_at', this._updateModel);
    */
  }

  if(this.geom.getPaths) {
    var paths = this.geom.getPaths();
    for(var i = 0; i < paths.length; ++i) {
      bindPath(paths[i]);
    }
  } else {
    for(var i = 0; i < this.geom.length; ++i) {
      bindPath(this.geom[i].getPath());
      google.maps.event.addListener(this.geom[i], 'mouseup', this._updateModel);
    }
  }

  /*for(var i = 0; i < events.length; ++i) {
    var e = events[i];
    this.geom.on(e, self._eventHandler(e));
  }*/

}

PathView.prototype = new GeometryView();

PathView.prototype._getGeoJSON= function(geom) {

  var geomType = {
    'google.maps.Polygon': ['Polygon', 'MultiPolygon'],
    'google.maps.Polyline': ['LineString', 'MultiLineString'],
    'google.maps.Marker': ['Point', 'MultiPoint']
  };

  var coordFn = {
    'Polygon': 'getPath',
    'MultiPolygon': 'getPath',
    'LineString': 'getPath',
    'MultiLineString': 'getPath',
    'Point': 'getPosition',
    'MultiPoint': 'getPosition'
  };

  function _coord(latlng) {
    return [latlng.lng(), latlng.lat()];
  }

  function _coords(latlngs) {
    var c = [];
    for(var i = 0; i < latlngs.length; ++i) {
      c.push(_coord(latlngs.getAt(i)));
    }
    return c;
  }

  var gType = this.model.get('geojson').type;
  // single
  if(!geom.length || geom.length == 1) {
    var g = geom.length ? geom[0]: geom;
    var coords;
    if(gType == 'Point' || gType == 'MultiPoint') {
      coords = _coord(g.getPosition());
    } else if(gType == 'Polygon' || gType == 'MultiPolygon') {
      coords = [[_coords(g.getPath())]];
    } else if(gType == 'LineString' || gType == 'MultiLineString') {
      coords = _coords(g.getPath());
    }
    return {
      type: gType,
      coordinates: coords
    }
  } else {
    // poly
    var c = [];
    for(var i = 0; i < geom.length; ++i) {
      c.push(this._getGeoJSON(geom[i]).coordinates);
    }
    return  {
      type: gType,
      coordinates: c
    }
  }
}

PathView.prototype._updateModel = function(e) {
  var self = this;
  setTimeout(function() {
  self.model.set('geojson', self._getGeoJSON(self.geom));
  }, 100)
}

PathView.prototype.edit = function(enable) {

  var fn = enable ? 'enable': 'disable';
  var g = this.geom.length ? this.geom: [this.geom];
  for(var i = 0; i < g.length; ++i) {
    g[i].setEditable(enable);
  }
  if(!enable) {
    this.model.set('geojson', this._getGeoJSON(this.geom));
  }
};

cdb.geo.gmaps = cdb.geo.gmaps || {};

cdb.geo.gmaps.PointView = PointView;
cdb.geo.gmaps.PathView = PathView;



})();
