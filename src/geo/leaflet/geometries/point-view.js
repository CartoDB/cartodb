var L = require('leaflet');
var _ = require('underscore');
var View = require('../../../core/view');

var PointView = View.extend({
  initialize: function (options) {
    if (!options.model) throw new Error('model is required');
    if (!options.mapView) throw new Error('mapView is required');

    this.model = this.model || options.model;
    this.mapView = options.mapView;
    this.leafletMap = this.mapView._getNativeMap();

    this.model.on('remove', this._onRemoveTriggered, this);
    this.model.on('change:latlng', this._onLatlngChanged, this);

    this._marker = this._createMarker();
    this._marker.on('dragstart', this._onDragStart.bind(this));
    this._marker.on('drag', _.debounce(this._onDrag.bind(this), 10));
    this._marker.on('dragend', this._onDragEnd.bind(this));
  },

  _onDragStart: function () {
    this._isDragging = true;
  },

  _onDrag: function (event) {
    this.model.set('latlng', this._marker.getLatLng());
  },

  _onDragEnd: function () {
    this._isDragging = false;
  },

  isDragging: function () {
    return !!this._isDragging;
  },

  _createMarker: function () {
    var markerOptions = {
      icon: L.icon({
        iconUrl: '/themes/img/default-marker-icon.png',
        iconAnchor: [11, 11]
      })
    };

    var isDraggable = this.model.get('draggable');
    if (isDraggable) {
      markerOptions.draggable = isDraggable;
    }
    return L.marker(this.model.get('latlng') || [0,0], markerOptions);
  },

  render: function () {
    this._marker.addTo(this.leafletMap);
  },

  _onLatlngChanged: function () {
    if (!this.isDragging()) {
      this._marker.setLatLng(this.model.get('latlng'));
    }
    this._updateModelsGeoJSON();
  },

  _updateModelsGeoJSON: function () {
    this.model.set({
      geojson: this._marker.toGeoJSON()
    });
  },

  _onRemoveTriggered: function () {
    this.leafletMap.removeLayer(this._marker);
    this.remove();
  }
});

module.exports = PointView;
