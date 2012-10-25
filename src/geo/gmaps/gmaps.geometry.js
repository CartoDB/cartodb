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
  style.path = google.maps.SymbolPath.CICLE;
  style.scale = style.weight;

  this.geom = new GeoJSON (
    geometryModel.get('geojson'),
    {
      icon: style
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
  style.path = google.maps.SymbolPath.CICLE;
  style.scale = style.weight;

  this.geom = new GeoJSON (
    geometryModel.get('geojson'),
    {
      icon: new google.maps.Symbol(style)
    }
  );

  /*_.each(this.geom._layers, function(g) {
    g.setStyle(geometryModel.get('style'));
    g.on('edit', function() {
      geometryModel.set('geojson', L.GeoJSON.toGeoJSON(self.geom));
    }, self);
  });
  */

  function bindPath(p) {
    google.maps.events.addListener(p, 'insert_at', this._updateModel);
    google.maps.events.addListener(p, 'remove_at', this._updateModel);
    google.maps.events.addListener(p, 'set_at', this._updateModel);
  }

  if(this.geom.getPaths) {
    var paths = this.geom.getPaths();
    for(var i = 0; i < paths.length; ++i) {
      bindPath(paths[i]);
    }
  } else {
    bindPath(this.geom.getPath());
  }

  /*for(var i = 0; i < events.length; ++i) {
    var e = events[i];
    this.geom.on(e, self._eventHandler(e));
  }*/

}

PathView.prototype = new GeometryView();

PathView.prototype.edit = function(enable) {
  var fn = enable ? 'enable': 'disable';
  this.geom.setEditable(enable);
};

cdb.geo.gmaps = cdb.geo.gmaps || {};

cdb.geo.gmaps.PointView = PointView;
cdb.geo.gmaps.PathView = PathView;



})();
