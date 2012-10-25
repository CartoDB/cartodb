(function() {
/**
 * this module implements all the features related to overlay geometries
 * in leaflet: markers, polygons, lines and so on
 */

// layer to geojson from https://raw.github.com/ebrehault/Leaflet/681d26aa0d301cb2ab5f0963eb1ea8fff14aa02c/src/layer/GeoJSON.js
// wait until leaflet includes it in the core
// see https://github.com/CloudMade/Leaflet/issues/712
L.Util.extend(L.GeoJSON, {
  toGeoJSON: function(target) {
    if (target instanceof L.Marker) {
        //Point
        return {
            coordinates: this.latLngToCoords(target.getLatLng()),
            type: 'Point'
        }
    } else if (target instanceof L.MultiPolygon || target instanceof L.MultiPolyline) {
        //MultiPolygon and MultiLineString
        var multi = [];
        var layers = target._layers;
        for (var stamp in layers) {
            multi.push(this.toGeoJSON(layers[stamp]).coordinates);
        }
        return {
            coordinates: multi,
            type: (target instanceof L.MultiPolygon) ? 'MultiPolygon': 'MultiLineString'
        };
    } else if (target instanceof L.Polygon) {
        //Polygon
        var coords = this.latLngsToCoords(target.getLatLngs());
        return {
            coordinates: [coords],
            type: 'Polygon'
        };
    } else if (target instanceof L.Polyline) {
        //Linestring
        var coords = this.latLngsToCoords(target.getLatLngs());
        return {
            coordinates: coords,
            type: 'LineString'
        };
    } else if (target instanceof L.FeatureGroup) {
        //Multi point and GeometryCollection
        var multi = [];
        var layers = target._layers;
        var points = true;
        for (var stamp in layers) {
            var json = this.toGeoJSON(layers[stamp]);
            multi.push(json);
            if (json.type !== 'Point') {
                points = false;
            }
        }
        if (points) {
            var coords = multi.map(function(geo){
                return geo.coordinates;
            });
            return {
                coordinates: coords,
                type: 'MultiPoint'
            };
        } else {
            return {
                geometries: multi,
                type: 'GeometryCollection'
            };
        }
    }
  },

  latLngToCoords: function(latlng) {
      return [latlng.lng, latlng.lat];
  },

  latLngsToCoords: function(arrLatlng) {
      var coords = [];
      arrLatlng.forEach(function(latlng) {
          coords.push(this.latLngToCoords(latlng));
      },
      this);
      return coords;
  }
});




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
          iconUrl: '/assets/icons/default_marker.png',
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

  _.each(this.geom._layers, function(g) {
    g.setStyle(geometryModel.get('style'));
    g.on('edit', function() {
      geometryModel.set('geojson', L.GeoJSON.toGeoJSON(self.geom));
    }, self);
  });
  /*for(var i = 0; i < events.length; ++i) {
    var e = events[i];
    this.geom.on(e, self._eventHandler(e));
  }*/

}

PathView.prototype = new GeometryView();

PathView.prototype.edit = function(enable) {
  var fn = enable ? 'enable': 'disable';
  _.each(this.geom._layers, function(g) {
    g.editing[fn]();
    g.off('edit', null, self);
  });
};

cdb.geo.leaflet = cdb.geo.leaflet || {};

cdb.geo.leaflet.PointView = PointView;
cdb.geo.leaflet.PathView = PathView;


})();
