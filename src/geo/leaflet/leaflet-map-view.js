var $ = require('jquery');
var _ = require('underscore');
var L = require('leaflet');
var cdb = require('cdb'); // cdb.geo.LeafletTorqueLayer
var log = require('cdb.log');
var MapView = require('../map-view');
var View = require('../../core/view');
var LeafletTiledLayerView = require('./leaflet-tiled-layer-view');
var LeafletWMSLayerView = require('./leaflet-wms-layer-view');
var LeafletPlainLayerView = require('./leaflet-plain-layer-view');
var LeafletGmapsTiledLayerView = require('./leaflet-gmaps-tiled-layer-view');
var LeafletCartoDBLayerGroupView = require('./leaflet-cartodb-layer-group-view');
var LeafletPointView = require('./leaflet-point-view');
var LeafletPathView = require('./leaflet-path-view');

/**
 * leaflet implementation of a map
 */
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

    if (!this.options.map_object) {

      this.map_leaflet = new L.Map(this.el, mapConfig);
      if (this.map.get("scrollwheel") == false) this.map_leaflet.scrollWheelZoom.disable();
      if (this.map.get("keyboard") == false) this.map_leaflet.keyboard.disable();
      if (this.map.get("drag") == false) {
        this.map_leaflet.dragging.disable();
        this.map_leaflet.doubleClickZoom.disable();
      }

    } else {

      this.map_leaflet = this.options.map_object;
      this.setElement(this.map_leaflet.getContainer());

      var c = self.map_leaflet.getCenter();

      self._setModelProperty({ center: [c.lat, c.lng] });
      self._setModelProperty({ zoom: self.map_leaflet.getZoom() });

      // unset bounds to not change mapbounds
      self.map.unset('view_bounds_sw', { silent: true });
      self.map.unset('view_bounds_ne', { silent: true });
    }

    this.map.bind('set_view', this._setView, this);
    this.map.layers.bind('add', this._addLayer, this);
    this.map.layers.bind('remove', this._removeLayer, this);
    this.map.layers.bind('reset', this._addLayers, this);

    this.map.geometries.bind('add', this._addGeometry, this);
    this.map.geometries.bind('remove', this._removeGeometry, this);

    this._bindModel();
    this._addLayers();

    this.map_leaflet.on('layeradd', function(lyr) {
      this.trigger('layeradd', lyr, self);
    }, this);

    this.map_leaflet.on('zoomstart', function() {
      self.trigger('zoomstart');
    });

    this.map_leaflet.on('click', function(e) {
      self.trigger('click', e.originalEvent, [e.latlng.lat, e.latlng.lng]);
    });

    this.map_leaflet.on('dblclick', function(e) {
      self.trigger('dblclick', e.originalEvent);
    });

    this.map_leaflet.on('zoomend', function() {
      self._setModelProperty({
        zoom: self.map_leaflet.getZoom()
      });
      self.trigger('zoomend');
    }, this);

    this.map_leaflet.on('move', function() {
      var c = self.map_leaflet.getCenter();
      self._setModelProperty({ center: [c.lat, c.lng] });
    });

    this.map_leaflet.on('dragend', function() {
      var c = self.map_leaflet.getCenter();
      this.trigger('dragend', [c.lat, c.lng]);
    }, this);

    this.map_leaflet.on('drag', function() {
      var c = self.map_leaflet.getCenter();
      self._setModelProperty({
        center: [c.lat, c.lng]
      });
      self.trigger('drag');
    }, this);

    this.map.bind('change:maxZoom', function() {
      L.Util.setOptions(self.map_leaflet, { maxZoom: self.map.get('maxZoom') });
    }, this);

    this.map.bind('change:minZoom', function() {
      L.Util.setOptions(self.map_leaflet, { minZoom: self.map.get('minZoom') });
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
  _addLayers: function() {
    var self = this;

    var oldLayers = this.layers;
    this.layers = {};

    function findLayerView(layer) {
      var lv = _.find(oldLayers, function(layer_view) {
        var m = layer_view.model;
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
      var layer_view = oldLayers[layer];
      if (!canReused(layer_view.model)) {
        layer_view.remove();
      }
    }

    this.map.layers.each(function(lyr) {
      var lv = findLayerView(lyr);
      if (!lv) {
        self._addLayer(lyr);
      } else {
        lv.setModel(lyr);
        self.layers[lyr.cid] = lv;
        self.trigger('newLayerView', lv, lv.model, self);
      }
    });

  },

  clean: function() {
    //see https://github.com/CloudMade/Leaflet/issues/1101
    L.DomEvent.off(window, 'resize', this.map_leaflet._onResize, this.map_leaflet);

    // remove layer views
    for(var layer in this.layers) {
      var layer_view = this.layers[layer];
      layer_view.remove();
      delete this.layers[layer];
    }

    View.prototype.clean.call(this);
  },

  _setKeyboard: function(model, z) {
    if (z) {
      this.map_leaflet.keyboard.enable();
    } else {
      this.map_leaflet.keyboard.disable();
    }
  },

  _setScrollWheel: function(model, z) {
    if (z) {
      this.map_leaflet.scrollWheelZoom.enable();
    } else {
      this.map_leaflet.scrollWheelZoom.disable();
    }
  },

  _setZoom: function(model, z) {
    this._setView();
  },

  _setCenter: function(model, center) {
    this._setView();
  },

  _setView: function() {
    this.map_leaflet.setView(this.map.get("center"), this.map.get("zoom") || 0 );
  },

  _addGeomToMap: function(geom) {
    var geo = LeafletMapView.createGeometry(geom);
    geo.geom.addTo(this.map_leaflet);
    return geo;
  },

  _removeGeomFromMap: function(geo) {
    this.map_leaflet.removeLayer(geo.geom);
  },

  createLayer: function(layer) {
    return LeafletMapView.createLayer(layer, this.map_leaflet);
  },

  // LAYER VIEWS ARE CREATED HERE
  _addLayer: function(layer, layers, opts) {
    var self = this;
    var lyr, layer_view;
    layer_view = LeafletMapView.createLayer(layer, this.map_leaflet);
    if (!layer_view) {
      return;
    }
    return this._addLayerToMap(layer_view, opts);
  },

  _addLayerToMap: function(layer_view, opts) {
    var layer = layer_view.model;

    this.layers[layer.cid] = layer_view;
    LeafletMapView.addLayerToMap(layer_view, this.map_leaflet);

    // reorder layers
    for(var i in this.layers) {
      var lv = this.layers[i];
      lv.setZIndex(lv.model.get('order'));
    }

    if(opts === undefined || !opts.silent) {
      this.trigger('newLayerView', layer_view, layer_view.model, this);
    }
    return layer_view;
  },

  pixelToLatLon: function(pos) {
    var point = this.map_leaflet.containerPointToLatLng([pos[0], pos[1]]);
    return point;
  },

  latLonToPixel: function(latlon) {
    var point = this.map_leaflet.latLngToLayerPoint(new L.LatLng(latlon[0], latlon[1]));
    return this.map_leaflet.layerPointToContainerPoint(point);
  },

  // return the current bounds of the map view
  getBounds: function() {
    var b = this.map_leaflet.getBounds();
    var sw = b.getSouthWest();
    var ne = b.getNorthEast();
    return [
      [sw.lat, sw.lng],
      [ne.lat, ne.lng]
    ];
  },

  getSize: function() {
    return this.map_leaflet.getSize();
  },

  panBy: function(p) {
    this.map_leaflet.panBy(new L.Point(p.x, p.y));
  },

  setCursor: function(cursor) {
    $(this.map_leaflet.getContainer()).css('cursor', cursor);
  },

  getNativeMap: function() {
    return this.map_leaflet;
  },

  invalidateSize: function() {
    // there is a race condition in leaflet. If size is invalidated
    // and at the same time the center is set the final center is displaced
    // so set pan to false so the map is not moved and then force the map
    // to be at the place it should be
    this.map_leaflet.invalidateSize({ pan: false })//, animate: false });
    this.map_leaflet.setView(this.map.get("center"), this.map.get("zoom") || 0, {
      animate: false
    });
  }

}, {

  layerTypeMap: {
    "tiled": LeafletTiledLayerView,
    "wms": LeafletWMSLayerView,
    "plain": LeafletPlainLayerView,

    // Substitutes the GMaps baselayer w/ an equivalent Leaflet tiled layer, since not supporting Gmaps anymore
    "gmapsbase": LeafletGmapsTiledLayerView,

    "layergroup": LeafletCartoDBLayerGroupView,
    "namedmap": LeafletCartoDBLayerGroupView,
    "torque": function(layer, map) {
      // TODO for now adding this error to be thrown if object is not present, since it's dependency
      // is not included in the standard bundle
      if (!cdb.geo.LeafletTorqueLayer) {
        throw new Error('torque library must have been loaded for a torque layer to work');
      }
      return new cdb.geo.LeafletTorqueLayer(layer, map);
    }
  },

  createLayer: function(layer, map) {
    var layer_view = null;
    var layerClass = this.layerTypeMap[layer.get('type').toLowerCase()];

    if (layerClass) {
      try {
        layer_view = new layerClass(layer, map);
      } catch (e) {
        log.error("MAP: error creating '" +  layer.get('type') + "' layer -> " + e.message);
        throw e;
      }
    } else {
      log.error("MAP: " + layer.get('type') + " can't be created");
    }
    return layer_view;
  },

  addLayerToMap: function(layer_view, map, pos) {
    map.addLayer(layer_view.leafletLayer);
    if(pos !== undefined) {
      if (layer_view.setZIndex) {
        layer_view.setZIndex(pos);
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
