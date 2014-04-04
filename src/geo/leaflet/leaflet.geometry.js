(function() {

/**
 * this module implements all the features related to overlay geometries
 * in leaflet: markers, polygons, lines and so on
 */


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

  this.geom = L.GeoJSON.geometryToLayer(geometryModel.get('geojson'), function(geojson, latLng) {
      //TODO: create marker depending on the visualizacion options
      var p = L.marker(latLng,{
        icon: L.icon({
          iconUrl: cdb.config.get('assets_url') + '/images/layout/default_marker.png',
          iconAnchor: [11, 11]
        })
      });

      var i;
      for(i = 0; i < events.length; ++i) {
        var e = events[i];
        p.on(e, self._eventHandler(e));
      }
      return p;
  });

  this.bind('dragend', function(e, pos) { 
    geometryModel.set({
      geojson: {
        type: 'Point',
        //geojson is lng,lat
        coordinates: [pos[1], pos[0]]
      }
    });
  });
}

PointView.prototype = new GeometryView();

PointView.prototype.edit = function() {
  this.geom.dragging.enable();
};

/**
 * returns a function to handle events fot evtType
 */
PointView.prototype._eventHandler = function(evtType) {
  var self = this;
  var h = this._eventHandlers[evtType];
  if(!h) {
    h = function(e) {
      var latlng = e.target.getLatLng();
      var s = [latlng.lat, latlng.lng];
      self.trigger(evtType, e.originalEvent, s);
    };
    this._eventHandlers[evtType] = h;
  }
  return h;
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

  
  this.geom = L.GeoJSON.geometryToLayer(geometryModel.get('geojson'));
  this.geom.setStyle(geometryModel.get('style'));

  
  /*for(var i = 0; i < events.length; ++i) {
    var e = events[i];
    this.geom.on(e, self._eventHandler(e));
  }*/

}

PathView.prototype = new GeometryView();

PathView.prototype._leafletLayers = function() {
  // check if this is a multi-feature or single-feature
  if (this.geom.getLayers) {
    return this.geom.getLayers();
  }
  return [this.geom];
};


PathView.prototype.enableEdit = function() {
  var self = this;
  var layers = this._leafletLayers();
  _.each(layers, function(g) {
    g.setStyle(self.model.get('style'));
    g.on('edit', function() {
      self.model.set('geojson', self.geom.toGeoJSON().geometry);
    }, self);
  });
};

PathView.prototype.disableEdit = function() {
  var self = this;
  var layers = this._leafletLayers();
  _.each(layers, function(g) {
    g.off('edit', null, self);
  });
};

PathView.prototype.edit = function(enable) {
  var self = this;
  var fn = enable ? 'enable': 'disable';
  var layers = this._leafletLayers();
  _.each(layers, function(g) {
    g.editing[fn]();
    enable ? self.enableEdit(): self.disableEdit();
  });
};

cdb.geo.leaflet = cdb.geo.leaflet || {};

cdb.geo.leaflet.PointView = PointView;
cdb.geo.leaflet.PathView = PathView;


})();
