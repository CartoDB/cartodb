var L = require('leaflet');
var _ = require('underscore');
var GeometryViewBase = require('./geometry-view-base');

var PointView = GeometryViewBase.extend({
  initialize: function (options) {
    GeometryViewBase.prototype.initialize.apply(this, arguments);
    this.model.on('change:latlng', this._onLatlngChanged, this);
  },

  _onLatlngChanged: function () {
    this._renderMarkerIfNotRendered();

    if (!this.isDragging()) {
      this._marker.setLatLng(this.model.get('latlng'));
    }
  },

  render: function () {
    if (this.model.get('latlng')) {
      this._renderMarkerIfNotRendered();
    }
  },

  _renderMarkerIfNotRendered: function () {
    if (!this._marker) {
      var markerOptions = {
        icon: L.icon({
          iconUrl: this.model.get('iconUrl'),
          iconAnchor: this.model.get('iconAnchor')
        })
      };

      var isDraggable = this.model.isEditable();
      if (isDraggable) {
        markerOptions.draggable = isDraggable;
      }

      this._marker = L.marker(this.model.get('latlng'), markerOptions);
      if (isDraggable) {
        this._marker.on('dragstart', this._onDragStart.bind(this));
        this._marker.on('drag', _.debounce(this._onDrag.bind(this), 10));
        this._marker.on('dragend', this._onDragEnd.bind(this));
      }
      this.leafletMap.addLayer(this._marker);
    }
  },

  _onDragStart: function () {
    this._isDragging = true;
  },

  _onDrag: function (event) {
    var latLng = this._marker.getLatLng();
    this.model.set('latlng', [ latLng.lat, latLng.lng ]);
  },

  _onDragEnd: function () {
    this._isDragging = false;
  },

  isDragging: function () {
    return !!this._isDragging;
  },

  _onGeometryRemoved: function () {
    GeometryViewBase.prototype._onGeometryRemoved.apply(this);
    this.leafletMap.removeLayer(this._marker);
  }
});

module.exports = PointView;
