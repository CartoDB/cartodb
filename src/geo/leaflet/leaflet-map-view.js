var $ = require('jquery');
var _ = require('underscore');
var L = require('leaflet');
var MapView = require('../map-view');
var View = require('../../core/view');
var Sanitize = require('../../core/sanitize');
var LeafletPointView = require('./leaflet-point-view');
var LeafletPathView = require('./leaflet-path-view');

var LeafletMapView = MapView.extend({

  initialize: function() {

    _.bindAll(this, '_addLayer', '_removeLayer', '_setZoom', '_setCenter', '_setView');

    MapView.prototype.initialize.call(this);

    var self = this;

    var center = this.map.get('center');

    var mapConfig = {
      zoomControl: false,
      center: new L.LatLng(center[0], center[1]),
      zoom: this.map.get('zoom'),
      minZoom: this.map.get('minZoom'),
      maxZoom: this.map.get('maxZoom'),
      attributionControl: false
    };

    if (!this.isMapAlreadyCreated()) {
      this._leafletMap = new L.Map(this.el, mapConfig);
      if (this.map.get("scrollwheel") == false) this._leafletMap.scrollWheelZoom.disable();
      if (this.map.get("keyboard") == false) this._leafletMap.keyboard.disable();
      if (this.map.get("drag") == false) {
        this._leafletMap.dragging.disable();
        this._leafletMap.doubleClickZoom.disable();
      }
    } else {
      this._leafletMap = this.options.map_object;
      this.setElement(this._leafletMap.getContainer());

      var c = self._leafletMap.getCenter();

      this._setModelProperty({ center: [c.lat, c.lng] });
      this._setModelProperty({ zoom: self._leafletMap.getZoom() });

      // unset bounds to not change mapbounds
      this.map.unset('view_bounds_sw', { silent: true });
      this.map.unset('view_bounds_ne', { silent: true });
    }

    this.map.bind('set_view', this._setView, this);

    this.map.geometries.bind('add', this._addGeometry, this);
    this.map.geometries.bind('remove', this._removeGeometry, this);

    this._bindModel();
    this._addLayers();
    this.setAttribution();

    this._leafletMap.on('layeradd', function(lyr) {
      this.trigger('layeradd', lyr, self);
    }, this);

    this._leafletMap.on('zoomstart', function() {
      self.trigger('zoomstart');
    });

    this._leafletMap.on('click', function(e) {
      self.trigger('click', e.originalEvent, [e.latlng.lat, e.latlng.lng]);
    });

    this._leafletMap.on('dblclick', function(e) {
      self.trigger('dblclick', e.originalEvent);
    });

    this._leafletMap.on('zoomend', function() {
      self._setModelProperty({
        zoom: self._leafletMap.getZoom()
      });
      self.trigger('zoomend');
    }, this);

    this._leafletMap.on('move', function() {
      var c = self._leafletMap.getCenter();
      self._setModelProperty({ center: [c.lat, c.lng] });
    });

    this._leafletMap.on('dragend', function() {
      var c = self._leafletMap.getCenter();
      this.trigger('dragend', [c.lat, c.lng]);
    }, this);

    this._leafletMap.on('drag', function() {
      var c = self._leafletMap.getCenter();
      self._setModelProperty({
        center: [c.lat, c.lng]
      });
      self.trigger('drag');
    }, this);

    this.map.bind('change:maxZoom', function() {
      L.Util.setOptions(self._leafletMap, { maxZoom: self.map.get('maxZoom') });
    }, this);

    this.map.bind('change:minZoom', function() {
      L.Util.setOptions(self._leafletMap, { minZoom: self.map.get('minZoom') });
    }, this);

    this.trigger('ready');

    // looks like leaflet dont like to change the bounds just after the inicialization
    var bounds = this.map.getViewBounds();

    if (bounds) {
      this.showBounds(bounds);
    }
  },

  // this replaces the default functionality to search for
  // already added views so they are not replaced
  _addLayers: function(layerCollection, options) {
    var self = this;

    var oldLayers = this._layerViews;
    this._layerViews = {};

    function findLayerView(layer) {
      var lv = _.find(oldLayers, function(layerView) {
        var m = layerView.model;
        return m.isEqual(layer);
      });
      return lv;
    }

    function canReused(layer) {
      return self.map.layers.find(function(m) {
        return m.isEqual(layer);
      });
    }

    // remove all
    for(var layer in oldLayers) {
      var layerView = oldLayers[layer];
      if (!canReused(layerView.model)) {
        layerView.remove();
      }
    }

    this.map.layers.each(function(layerModel) {
      var layerView = findLayerView(layerModel);
      if (!layerView) {
        self._addLayer(layerModel, layerCollection, {
          silent: (options && options.silent) || false,
          index: options && options.index
        });
      } else {
        layerView.setModel(layerModel);
        self._layerViews[layerModel.cid] = layerView;
        self.trigger('newLayerView', layerView, layerModel, self);
      }
    });
  },

  clean: function() {
    //see https://github.com/CloudMade/Leaflet/issues/1101
    L.DomEvent.off(window, 'resize', this._leafletMap._onResize, this._leafletMap);

    // remove layer views
    for(var layer in this._layerViews) {
      var layerView = this._layerViews[layer];
      layerView.remove();
      delete this._layerViews[layer];
    }

    View.prototype.clean.call(this);
  },

  _setKeyboard: function(model, z) {
    if (z) {
      this._leafletMap.keyboard.enable();
    } else {
      this._leafletMap.keyboard.disable();
    }
  },

  _setScrollWheel: function(model, z) {
    if (z) {
      this._leafletMap.scrollWheelZoom.enable();
    } else {
      this._leafletMap.scrollWheelZoom.disable();
    }
  },

  _setZoom: function(model, z) {
    this._setView();
  },

  _setCenter: function(model, center) {
    this._setView();
  },

  _setView: function() {
    this._leafletMap.setView(this.map.get("center"), this.map.get("zoom") || 0 );
  },

  _addGeomToMap: function(geom) {
    var geo = LeafletMapView.createGeometry(geom);
    geo.geom.addTo(this._leafletMap);
    return geo;
  },

  _removeGeomFromMap: function(geo) {
    this._leafletMap.removeLayer(geo.geom);
  },

  _getNativeMap: function () {
    return this._leafletMap;
  },

  _addLayerToMap: function(layerView, layerModel, opts) {
    LeafletMapView.addLayerToMap(layerView, this._leafletMap);

    this._reorderLayerViews();

    if (!opts.silent) {
      this.trigger('newLayerView', layerView);
    }
    return layerView;
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

  pixelToLatLon: function(pos) {
    var point = this._leafletMap.containerPointToLatLng([pos[0], pos[1]]);
    return point;
  },

  latLonToPixel: function(latlon) {
    var point = this._leafletMap.latLngToLayerPoint(new L.LatLng(latlon[0], latlon[1]));
    return this._leafletMap.layerPointToContainerPoint(point);
  },

  // return the current bounds of the map view
  getBounds: function() {
    var b = this._leafletMap.getBounds();
    var sw = b.getSouthWest();
    var ne = b.getNorthEast();
    return [
      [sw.lat, sw.lng],
      [ne.lat, ne.lng]
    ];
  },

  setAttribution: function(mdl) {
    var attributionControl = this._leafletMap.attributionControl;
    if (this.isMapAlreadyCreated() && attributionControl) {
      // If this method comes from an attribution property change
      if (mdl) {
        var previousAttributions = mdl.previous('attribution');
        _.each(previousAttributions, function(text) {
          attributionControl.removeAttribution(Sanitize.html(text));
        });
      }
      var currentAttributions = this.map.get('attribution');
      _.each(currentAttributions, function(text) {
        attributionControl.addAttribution(Sanitize.html(text));
      });
    }
  },

  getSize: function() {
    return this._leafletMap.getSize();
  },

  panBy: function(p) {
    this._leafletMap.panBy(new L.Point(p.x, p.y));
  },

  setCursor: function(cursor) {
    $(this._leafletMap.getContainer()).css('cursor', cursor);
  },

  getNativeMap: function() {
    return this._leafletMap;
  },

  invalidateSize: function() {
    // there is a race condition in leaflet. If size is invalidated
    // and at the same time the center is set the final center is displaced
    // so set pan to false so the map is not moved and then force the map
    // to be at the place it should be
    this._leafletMap.invalidateSize({ pan: false })//, animate: false });
    this._leafletMap.setView(this.map.get("center"), this.map.get("zoom") || 0, {
      animate: false
    });
  }

}, {
  addLayerToMap: function(layerView, map, pos) {
    map.addLayer(layerView.leafletLayer);
    if(pos !== undefined) {
      if (layerView.setZIndex) {
        layerView.setZIndex(pos);
      }
    }
  },

  /**
   * create the view for the geometry model
   */
  createGeometry: function(geometryModel) {
    if(geometryModel.isPoint()) {
      return new LeafletPointView(geometryModel);
    }
    return new LeafletPathView(geometryModel);
  }

});

// set the image path in order to be able to get leaflet icons
// code adapted from leaflet
L.Icon.Default.imagePath = (function () {
  var scripts = document.getElementsByTagName('script'),
      leafletRe = /\/?cartodb[\-\._]?([\w\-\._]*)\.js\??/;

  var i, len, src, matches;

  for (i = 0, len = scripts.length; i < len; i++) {
    src = scripts[i].src;
    matches = src.match(leafletRe);

    if (matches) {
      var bits = src.split('/')
      delete bits[bits.length - 1];
      return bits.join('/') + 'themes/css/images';
    }
  }
}());

module.exports = LeafletMapView;
