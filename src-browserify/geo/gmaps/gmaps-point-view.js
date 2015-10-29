var google = window.google;
var _ = require('underscore');
var GeoJSON = require('geojson');
var config = require('cdb.config');
var GeometryView = require('../geometry-view');

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
  var iconAnchor = this.model.get('iconAnchor');

  var icon = {
    url: this.model.get('iconUrl') || config.get('assets_url') + '/images/layout/default_marker.png',
    anchor: {
      x: iconAnchor && iconAnchor[0] || 10,
      y: iconAnchor && iconAnchor[1] || 10,
    }
  };

  this.geom = new GeoJSON(
    geometryModel.get('geojson'),
    {
      icon: icon,
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

module.exports = PointView;
