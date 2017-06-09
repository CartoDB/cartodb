/* global google */
var _ = require('underscore');
var MapView = require('../map-view');
var Projector = require('./projector');
var GMapsLayerViewFactory = require('./gmaps-layer-view-factory');

var GoogleMapsMapView = MapView.extend({
  initialize: function () {
    _.bindAll(this, '_ready');
    this._isReady = false;

    MapView.prototype.initialize.apply(this, arguments);
  },

  _createNativeMap: function () {
    var self = this;
    var center = this.map.get('center');

    this._gmapsMap = new google.maps.Map(this.el, {
      center: new google.maps.LatLng(center[0], center[1]),
      zoom: this.map.get('zoom'),
      minZoom: this.map.get('minZoom'),
      maxZoom: this.map.get('maxZoom'),
      disableDefaultUI: true,
      scrollwheel: this.map.get('scrollwheel'),
      draggable: this.map.get('drag'),
      disableDoubleClickZoom: !this.map.get('drag'),
      mapTypeControl: false,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      backgroundColor: 'white',
      tilt: 0
    });

    this.map.bind('change:maxZoom', function () {
      self._gmapsMap.setOptions({ maxZoom: self.map.get('maxZoom') });
    }, this);

    this.map.bind('change:minZoom', function () {
      self._gmapsMap.setOptions({ minZoom: self.map.get('minZoom') });
    }, this);

    google.maps.event.addListener(this._gmapsMap, 'center_changed', function () {
      var c = self._gmapsMap.getCenter();
      self._setModelProperty({ center: [c.lat(), c.lng()] });
    });

    google.maps.event.addListener(this._gmapsMap, 'zoom_changed', function () {
      self._setModelProperty({
        zoom: self._gmapsMap.getZoom()
      });
      var c = self._gmapsMap.getCenter();
      self.map.trigger('moveend', [c.lat(), c.lng()]);
    });

    google.maps.event.addListener(this._gmapsMap, 'click', function (e) {
      self.trigger('click', e, [e.latLng.lat(), e.latLng.lng()]);
    });

    google.maps.event.addListener(this._gmapsMap, 'dragend', function (e) {
      var c = self._gmapsMap.getCenter();
      self.trigger('dragend', [c.lat(), c.lng()]);
      self.map.trigger('moveend', [c.lat(), c.lng()]);
    });

    google.maps.event.addListener(this._gmapsMap, 'dblclick', function (e) {
      self.trigger('dblclick', e);
    });

    google.maps.event.addListener(this._gmapsMap, 'bounds_changed', function (e) {
      self.map.setMapViewSize(self.getSize());
    });

    this.projector = new Projector(this._gmapsMap);

    this.projector.draw = this._ready;
  },

  clean: function () {
    google.maps.event.clearInstanceListeners(window);
    google.maps.event.clearInstanceListeners(document);

    MapView.prototype.clean.call(this);
  },

  _getLayerViewFactory: function () {
    this._layerViewFactory = this._layerViewFactory || new GMapsLayerViewFactory();

    return this._layerViewFactory;
  },

  _ready: function () {
    this.projector.draw = function () {};
    this.trigger('ready');
    this._isReady = true;
  },

  _setKeyboard: function (model, z) {
    this._gmapsMap.setOptions({ keyboardShortcuts: z });
  },

  _setScrollWheel: function (model, z) {
    this._gmapsMap.setOptions({ scrollwheel: z });
  },

  _setZoom: function (z) {
    z = z || 0;
    this._gmapsMap.setZoom(z);
  },

  _setCenter: function (center) {
    var c = new google.maps.LatLng(center[0], center[1]);
    this._gmapsMap.setCenter(c);
  },

  _setView: function () {
    if (this.map.hasChanged('zoom')) {
      this._setZoom(this.map.get('zoom'));
    }
    if (this.map.hasChanged('center')) {
      this._setCenter(this.map.get('center'));
    }
  },

  _getNativeMap: function () {
    return this._gmapsMap;
  },

  _addLayerToMap: function (layerView) {
    layerView.addToMap();
  },

  getSize: function () {
    return {
      x: this.$el.width(),
      y: this.$el.height()
    };
  },

  panBy: function (p) {
    var c = this.map.get('center');
    var pc = this.latLngToContainerPoint(c);
    p.x += pc.x;
    p.y += pc.y;
    var ll = this.containerPointToLatLng(p);
    this.map.setCenter([ll.lat, ll.lng]);
  },

  getBounds: function () {
    if (this._isReady) {
      var b = this._gmapsMap.getBounds();
      var sw = b.getSouthWest();
      var ne = b.getNorthEast();
      return [
        [sw.lat(), sw.lng()],
        [ne.lat(), ne.lng()]
      ];
    }
    return [ [0, 0], [0, 0] ];
  },

  setCursor: function (cursor) {
    this._gmapsMap.setOptions({ draggableCursor: cursor });
  },

  getNativeMap: function () {
    return this._gmapsMap;
  },

  invalidateSize: function () {
    google.maps.event.trigger(this._gmapsMap, 'resize');
    this.map.setMapViewSize(this.getSize());
  },

  // GEOMETRY

  addMarker: function (marker) {
    marker.addToMap(this.getNativeMap());
  },

  removeMarker: function (marker) {
    marker.removeFromMap(this.getNativeMap());
  },

  hasMarker: function (marker) {
    return marker.isAddedToMap(this.getNativeMap());
  },

  addPath: function (path) {
    path.addToMap(this.getNativeMap());
  },

  removePath: function (path) {
    path.removeFromMap(this.getNativeMap());
  },

  latLngToContainerPoint: function (latlng) {
    var point = this.projector.latLngToPixel(new google.maps.LatLng(latlng[0], latlng[1]));
    return {
      x: point.x,
      y: point.y
    };
  },

  containerPointToLatLng: function (point) {
    var latlng = this.projector.pixelToLatLng(new google.maps.Point(point.x, point.y));
    return {
      lat: latlng.lat(),
      lng: latlng.lng()
    };
  }
});

module.exports = GoogleMapsMapView;
