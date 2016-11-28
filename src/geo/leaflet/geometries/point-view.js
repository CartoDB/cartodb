var L = require('leaflet');
var _ = require('underscore');
var GeometryViewBase = require('./geometry-view-base');

var DRAG_DEBOUNCE_TIME_IN_MILIS = 0;

var PointView = GeometryViewBase.extend({
  initialize: function (options) {
    GeometryViewBase.prototype.initialize.apply(this, arguments);
    this.model.on('change:latlng', this._onLatlngChanged, this);
    this.model.on('change:iconUrl change:iconAnchor', this._updateMarkersIcon, this);

    this._marker = null;
    if (options.nativeMarker) {
      this._marker = options.nativeMarker;
      this._updateMarkersIcon();
    }

    // This method is debounced and we need to initialize it here so that:
    //  1. Binding/unbinding can use the debounced function as the callback.
    //  2. Debouncing can be easily disabled in the tests
    this._onDrag = _.debounce(function () {
      if (this._marker) {
        var latLng = this._marker.getLatLng();
        this.model.set('latlng', [ latLng.lat, latLng.lng ]);
      }
    }.bind(this), DRAG_DEBOUNCE_TIME_IN_MILIS);

    _.bindAll(this, '_onDragStart', '_onDrag', '_onDragEnd', '_onMouseDown', '_onMouseClick');
  },

  getNativeMarker: function () {
    return this._marker;
  },

  unsetMarker: function () {
    console.log('unset marker for view', this.cid);
    delete this._marker;
  },

  _onLatlngChanged: function () {
    this._renderMarkerIfNotRendered();

    if (!this.isDragging()) {
      this._marker.setLatLng(this.model.get('latlng'));
    }
  },

  _updateMarkersIcon: function () {
    if (this._marker) {
      var newIcon = this._createMarkerIcon();
      this._marker.setIcon(newIcon);
    }
  },

  _createMarkerIcon: function () {
    // return L.divIcon({ html: '<p>' + this.cid + '</p>' });
    return L.icon({
      iconUrl: this.model.get('iconUrl'),
      iconAnchor: this.model.get('iconAnchor')
    });
  },

  render: function () {
    if (this.model.get('latlng')) {
      this._renderMarkerIfNotRendered();
    }
  },

  _renderMarkerIfNotRendered: function () {
    var isEditable = this.model.isEditable();
    if (this._isMarkerRendered()) {
      this._marker.off('dragstart', this._onDragStart);
      this._marker.off('drag', this._onDrag);
      this._marker.off('dragend', this._onDragEnd);
      this._marker.off('mousedown', this._onMouseDown);
      this._marker.off('click', this._onMouseClick);
    } else {
      var markerOptions = {
        icon: this._createMarkerIcon()
      };

      markerOptions.draggable = !!isEditable;

      this._marker = L.marker(this.model.get('latlng'), markerOptions);
      this.leafletMap.addLayer(this._marker);
    }

    if (isEditable) {
      this._marker.on('dragstart', this._onDragStart);
      this._marker.on('drag', this._onDrag);
      this._marker.on('dragend', this._onDragEnd);
      this._marker.on('mousedown', this._onMouseDown);
      this._marker.on('click', this._onMouseClick);
    }
  },

  _isMarkerRendered: function () {
    return this._marker && this.leafletMap.hasLayer(this._marker);
  },

  _onDragStart: function () {
    this._isDragging = true;
  },

  _onDragEnd: function () {
    this._isDragging = false;
  },

  _onMouseDown: function () {
    this._mouseDownClicked = true;
    this.trigger('mousedown', this.model);
  },

  _onMouseClick: function () {
    // Some point views reuse existing markers.
    // We want to only trigger the 'click' event if marker
    // was clicked while being associated to this view.
    if (this._mouseDownClicked) {
      this.trigger('click', this.model);
    }
  },

  isDragging: function () {
    return !!this._isDragging;
  },

  clean: function () {
    GeometryViewBase.prototype.clean.apply(this);
    if (this._marker) {
      console.log('removed marker at', this.model.getCoordinates().join(','), this.cid);
      this.leafletMap.removeLayer(this._marker);
    }
  }
});

module.exports = PointView;
