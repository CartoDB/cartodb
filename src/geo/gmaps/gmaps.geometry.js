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
  //style.path = google.maps.SymbolPath.CIRCLE;
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
          url: cdb.config.get('assets_url') + '/images/layout/default_marker.png',
          anchor: {x: 10, y: 10}
      },
      raiseOnDrag: false,
      crossOnDrag: false
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

  // TODO: check this conditions

  if(this.geom.getPaths) {
    var paths = this.geom.getPaths();

    if (paths && paths[0]) {
      // More than one path
      for(var i = 0; i < paths.length; ++i) {
        bindPath(paths[i]);
      }
    } else {
      // One path
      bindPath(paths);
      google.maps.event.addListener(this.geom, 'mouseup', this._updateModel);
    }
  } else {
    // More than one path
    if (this.geom.length) {
      for(var i = 0; i < this.geom.length; ++i) {
        bindPath(this.geom[i].getPath());
        google.maps.event.addListener(this.geom[i], 'mouseup', this._updateModel);
      }
    } else {
      // One path
      bindPath(this.geom.getPath());
      google.maps.event.addListener(this.geom, 'mouseup', this._updateModel);
    }
  }

  /*for(var i = 0; i < events.length; ++i) {
    var e = events[i];
    this.geom.on(e, self._eventHandler(e));
  }*/

}

PathView.prototype = new GeometryView();

PathView.getGeoJSON = function(geom, gType) {

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

  // single
  if(!geom.length || geom.length == 1) {
    var g = geom.length ? geom[0]: geom;
    var coords;
    if(gType == 'Point') {
      coords = _coord(g.getPosition());
    } else if(gType == 'MultiPoint') {
      coords = [_coord(g.getPosition())]
    } else if(gType == 'Polygon') {
      coords = [_coords(g.getPath())];
      coords[0].push(_coord(g.getPath().getAt(0)));
    } else if(gType == 'MultiPolygon') {
      coords = [];
      for(var p = 0; p < g.getPaths().length; ++p) {
        var c = _coords(g.getPaths().getAt(p));
        c.push(_coord(g.getPaths().getAt(p).getAt(0)));
        coords.push(c);
      }
      coords = [coords]
    } else if(gType == 'LineString') {
      coords = _coords(g.getPath());
    } else if(gType == 'MultiLineString') {
      //TODO: redo
      coords = [_coords(g.getPath())];
    }
    return {
      type: gType,
      coordinates: coords
    }
  } else {
    // poly
    var c = [];
    for(var i = 0; i < geom.length; ++i) {
      c.push(PathView.getGeoJSON(geom[i], gType).coordinates[0]);
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
  self.model.set('geojson', PathView.getGeoJSON(self.geom, self.model.get('geojson').type ));
  }, 100)
}

PathView.prototype.edit = function(enable) {

  var fn = enable ? 'enable': 'disable';
  var g = this.geom.length ? this.geom: [this.geom];
  for(var i = 0; i < g.length; ++i) {
    g[i].setEditable(enable);
  }
  if(!enable) {
    this.model.set('geojson', PathView.getGeoJSON(this.geom, this.model.get('geojson').type));
  }
};

cdb.geo.gmaps = cdb.geo.gmaps || {};

cdb.geo.gmaps.PointView = PointView;
cdb.geo.gmaps.PathView = PathView;



})();
