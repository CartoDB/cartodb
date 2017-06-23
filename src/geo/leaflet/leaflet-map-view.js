var $ = require('jquery');
var _ = require('underscore');
var L = require('leaflet');
var MapView = require('../map-view');
var LeafletLayerViewFactory = require('./leaflet-layer-view-factory');

var LeafletMapView = MapView.extend({
  _createNativeMap: function () {
    var self = this;
    var center = this.map.get('center');

    var mapConfig = {
      zoomControl: false,
      center: new L.LatLng(center[0], center[1]),
      zoom: this.map.get('zoom'),
      minZoom: this.map.get('minZoom'),
      maxZoom: this.map.get('maxZoom'),
      dragging: !!this.map.get('drag'),
      doubleClickZoom: !!this.map.get('drag'),
      scrollWheelZoom: !!this.map.get('scrollwheel'),
      keyboard: !!this.map.get('keyboard'),
      attributionControl: false
    };

    this._leafletMap = new L.Map(this.el, mapConfig);

    this.map.bind('set_view', this._setView, this);

    this._leafletMap.on('layeradd', function (lyr) {
      this.trigger('layeradd', lyr, self);
    }, this);

    this._leafletMap.on('zoomstart', function () {
      self.trigger('zoomstart');
    });

    this._leafletMap.on('click', function (e) {
      self.trigger('click', e.originalEvent, [e.latlng.lat, e.latlng.lng]);
    });

    this._leafletMap.on('dblclick', function (e) {
      self.trigger('dblclick', e.originalEvent);
    });

    this._leafletMap.on('zoomend', function () {
      self._setModelProperty({
        zoom: self._leafletMap.getZoom()
      });
      self.trigger('zoomend');
    }, this);

    this._leafletMap.on('dragend', function () {
      var c = self._leafletMap.getCenter();
      this.trigger('dragend', [c.lat, c.lng]);
    }, this);

    this._leafletMap.on('moveend', function () {
      var c = self._leafletMap.getCenter();
      self._setModelProperty({
        center: [c.lat, c.lng]
      });
      self.map.trigger('moveend', [c.lat, c.lng]);
    }, this);

    this._leafletMap.on('drag', function () {
      var c = self._leafletMap.getCenter();
      self._setModelProperty({
        center: [c.lat, c.lng]
      });
      self.trigger('drag');
    }, this);

    this._leafletMap.on('resize', function () {
      this.map.setMapViewSize(this.getSize());
    }, this);

    this.map.bind('change:maxZoom', function () {
      L.Util.setOptions(self._leafletMap, { maxZoom: self.map.get('maxZoom') });
    }, this);

    this.map.bind('change:minZoom', function () {
      L.Util.setOptions(self._leafletMap, { minZoom: self.map.get('minZoom') });
    }, this);
  },

  _getLayerViewFactory: function () {
    this._layerViewFactory = this._layerViewFactory || new LeafletLayerViewFactory();

    return this._layerViewFactory;
  },

  // this replaces the default functionality to search for
  // already added views so they are not replaced
  _addLayers: function (layerCollection, options) {
    var self = this;

    var oldLayers = this._layerViews;
    this._layerViews = {};

    function findLayerView (layer) {
      var lv = _.find(oldLayers, function (layerView) {
        var m = layerView.model;
        return m.isEqual(layer);
      });
      return lv;
    }

    function canReused (layer) {
      return self.map.layers.find(function (m) {
        return m.isEqual(layer);
      });
    }

    // remove all
    for (var layer in oldLayers) {
      var layerView = oldLayers[layer];
      if (!canReused(layerView.model)) {
        layerView.remove();
      }
    }

    this.map.layers.each(function (layerModel) {
      var layerView = findLayerView(layerModel);
      if (!layerView) {
        self._addLayer(layerModel, layerCollection, {
          silent: (options && options.silent) || false,
          index: options && options.index
        });
      } else {
        layerView.setModel(layerModel);
        self._layerViews[layerModel.cid] = layerView;
      }
    });
  },

  clean: function () {
    // see https://github.com/CloudMade/Leaflet/issues/1101
    L.DomEvent.off(window, 'resize', this._leafletMap._onResize, this._leafletMap);

    // destroy the map and clear all related event listeners
    this._leafletMap.remove();

    MapView.prototype.clean.call(this);
  },

  _setKeyboard: function (model, z) {
    if (z) {
      this._leafletMap.keyboard.enable();
    } else {
      this._leafletMap.keyboard.disable();
    }
  },

  _setScrollWheel: function (model, z) {
    if (z) {
      this._leafletMap.scrollWheelZoom.enable();
    } else {
      this._leafletMap.scrollWheelZoom.disable();
    }
  },

  _setZoom: function (model, z) {
    this._setView();
  },

  _setCenter: function (model, center) {
    this._setView();
  },

  _setView: function () {
    if (this.map.hasChanged('zoom') || this.map.hasChanged('center')) {
      this._leafletMap.flyTo(this.map.get('center'), this.map.get('zoom') || 0);
    }
  },

  _getNativeMap: function () {
    return this._leafletMap;
  },

  _addLayerToMap: function (layerView) {
    this._leafletMap.addLayer(layerView.leafletLayer);
    this._reorderLayerViews();
  },

  _reorderLayerViews: function () {
    this.map.layers.each(function (layerModel) {
      var layerView = this.getLayerViewByLayerCid(layerModel.cid);

      // CartoDBLayers share the same layerView so the zIndex is being overriden on every iteration.
      // The layerView will get the order of the last CartoDB layer as the zIndex
      if (layerView) {
        layerView.setZIndex(layerModel.get('order'));
      }
    }, this);
  },

  // return the current bounds of the map view
  getBounds: function () {
    var b = this._leafletMap.getBounds();
    var sw = b.getSouthWest();
    var ne = b.getNorthEast();
    return [
      [sw.lat, sw.lng],
      [ne.lat, ne.lng]
    ];
  },

  getSize: function () {
    return this._leafletMap.getSize();
  },

  panBy: function (p) {
    this._leafletMap.panBy(new L.Point(p.x, p.y));
  },

  setCursor: function (cursor) {
    $(this._leafletMap.getContainer()).css('cursor', cursor);
  },

  getNativeMap: function () {
    return this._leafletMap;
  },

  invalidateSize: function () {
    var center = this.map.get('center');
    var zoom = this.map.get('zoom');
    this._leafletMap.invalidateSize({ pan: false, animate: false });
    this._leafletMap.setView(center, zoom, { pan: false, animate: false });
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
    var point = this.getNativeMap().latLngToContainerPoint(latlng);
    return {
      x: point.x,
      y: point.y
    };
  },

  // returns { lat: 0, lng: 0}
  containerPointToLatLng: function (point) {
    var latlng = this.getNativeMap().containerPointToLatLng([point.x, point.y]);
    return {
      lat: latlng.lat,
      lng: latlng.lng
    };
  }
});

// set the image path in order to be able to get leaflet icons
// code adapted from leaflet
L.Icon.Default.imagePath = (function () {
  var scripts = document.getElementsByTagName('script');
  var leafletRe = /\/?cartodb[\-\._]?([\w\-\._]*)\.js\??/;

  var i, len, src, matches;

  for (i = 0, len = scripts.length; i < len; i++) {
    src = scripts[i].src;
    matches = src.match(leafletRe);

    if (matches) {
      var bits = src.split('/');
      delete bits[bits.length - 1];
      return bits.join('/') + 'themes/css/images';
    }
  }
}());

module.exports = LeafletMapView;
