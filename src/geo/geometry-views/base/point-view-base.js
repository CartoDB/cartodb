var _ = require('underscore');
var GeometryViewBase = require('./geometry-view-base');

var DRAG_DEBOUNCE_TIME_IN_MILIS = 10;

var PointViewBase = GeometryViewBase.extend({
  initialize: function (options) {
    GeometryViewBase.prototype.initialize.apply(this, arguments);
    this.model.on('change:latlng', this._onLatlngChanged, this);
    this.model.on('change:iconUrl change:iconAnchor', this._updateMarkersIcon, this);

    this._marker = null;
    if (options.marker) {
      this._marker = options.marker;
      this._updateMarkersIcon();
    }

    // This method is debounced and we need to initialize it here so that:
    //  1. Binding/unbinding can use the debounced function as the callback.
    //  2. Debouncing can be easily disabled in the tests
    this._onDrag = _.debounce(this._updateModelFromMarker.bind(this), DRAG_DEBOUNCE_TIME_IN_MILIS);

    _.bindAll(this, '_onDragStart', '_onDrag', '_onDragEnd', '_onMouseDown', '_onMouseClick');
  },

  getMarker: function () {
    return this._marker;
  },

  unsetMarker: function () {
    this._unbindMarkerEvents();
    delete this._marker;
  },

  _onLatlngChanged: function () {
    this._renderMarkerIfNotRendered();

    if (!this.isDragging()) {
      this._updateMarkerFromModel();
    }
  },

  render: function () {
    if (this.model.get('latlng')) {
      this._renderMarkerIfNotRendered();
    }
  },

  _renderMarkerIfNotRendered: function () {
    var isEditable = this.model.isEditable();
    if (this._isMarkerRendered()) {
      this._unbindMarkerEvents();
    } else {
      this._marker = this._createMarker();
      this.mapView.addMarker(this._marker);
    }

    if (isEditable) {
      this._bindMarkerEvents();
    }
  },

  _isMarkerRendered: function () {
    return this._marker && this.mapView.hasMarker(this._marker);
  },

  _removeMarker: function () {
    if (this._marker) {
      // this._unbindMarkerEvents();
      this.mapView.removeMarker(this._marker);
    }
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
      this._mouseDownClicked = false;
    }
  },

  isDragging: function () {
    return !!this._isDragging;
  },

  clean: function () {
    GeometryViewBase.prototype.clean.apply(this);
    this._removeMarker();
  },

  _updateModelFromMarker: function () {
    if (this._marker) {
      var latLng = this._marker.getCoordinates();
      this.model.setCoordinates([ latLng.lat, latLng.lng ]);
    }
  },

  _updateMarkerFromModel: function () {
    this._marker.setCoordinates(this.model.getCoordinates());
  },

  _updateMarkersIcon: function () {
    if (this._marker) {
      this._marker.setIconURL(this.model.get('iconUrl'), this.model.get('iconAnchor'));
    }
  },

  _createMarker: function () {
    throw new Error('subclasses of PointViewBase must implement _createMarker');
  },

  _unbindMarkerEvents: function () {
    this._marker.off('mousedown', this._onMouseDown);
    this._marker.off('dragstart', this._onDragStart);
    this._marker.off('drag', this._onDrag);
    this._marker.off('dragend', this._onDragEnd);
  },

  _bindMarkerEvents: function () {
    this._marker.on('mousedown', this._onMouseDown);
    this._marker.on('dragstart', this._onDragStart);
    this._marker.on('drag', this._onDrag);
    this._marker.on('dragend', this._onDragEnd);
  }
});

module.exports = PointViewBase;
