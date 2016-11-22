var L = require('leaflet');
var _ = require('underscore');
var GeometryViewBase = require('./geometry-view-base');

var PointView = GeometryViewBase.extend({
  initialize: function (options) {
    GeometryViewBase.prototype.initialize.apply(this, arguments);
    this.model.on('change:latlng', this._onLatlngChanged, this);
    this.model.on('change:iconUrl change:iconAnchor', this._onIconChanged, this);
    this._marker = options.nativeGeometry || null;
  },

  getNativeGeometry: function () {
    return this._marker;
  },

  _onLatlngChanged: function () {
    this._renderMarkerIfNotRendered();

    if (!this.isDragging()) {
      this._marker.setLatLng(this.model.get('latlng'));
    }
  },

  _onIconChanged: function () {
    this._renderMarkerIfNotRendered();
    var newIcon = L.icon({
      iconUrl: this.model.get('iconUrl'),
      iconAnchor: this.model.get('iconAnchor')
    });
    this._marker.setIcon(newIcon);
  },

  render: function () {
    if (this.model.get('latlng')) {
      this._renderMarkerIfNotRendered();
    }
  },

  _renderMarkerIfNotRendered: function () {
    var isEditable = this.model.isEditable();
    if (this._isMarkerRendered()) {
      this._marker.off('dragstart');
      this._marker.off('drag');
      this._marker.off('dragend');
      this._marker.off('mousedown');
    } else {
      var markerOptions = {
        icon: L.icon({
          iconUrl: this.model.get('iconUrl'),
          iconAnchor: this.model.get('iconAnchor')
        })
      };

      markerOptions.draggable = !!isEditable;

      this._marker = L.marker(this.model.get('latlng'), markerOptions);
      this.leafletMap.addLayer(this._marker);
    }

    if (isEditable) {
      this._marker.on('dragstart', this._onDragStart.bind(this));
      this._marker.on('drag', _.debounce(this._onDrag.bind(this), 10));
      this._marker.on('dragend', this._onDragEnd.bind(this));

      // TODO: isExpandable
      this._marker.on('mousedown', this._onMouseDown.bind(this));
    }
  },

  _isMarkerRendered: function () {
    return this._marker && this.leafletMap.hasLayer(this._marker);
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

  _onMouseDown: function () {
    this.trigger('mousedown', this.model);
  },

  isDragging: function () {
    return !!this._isDragging;
  },

  _onGeometryRemoved: function () {
    GeometryViewBase.prototype._onGeometryRemoved.apply(this);
    if (this._marker) {
      this.leafletMap.removeLayer(this._marker);
    }
  }
});

module.exports = PointView;
