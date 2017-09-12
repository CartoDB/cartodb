var _ = require('underscore');
var L = require('leaflet');
var Backbone = require('backbone');
var config = require('cdb.config');
var log = require('cdb.log');
var Model = require('../core/model');
var util = require('../core/util');
var Layers = require('./map/layers');
var sanitize = require('../core/sanitize');
var GeometryFactory = require('./geometry-models/geometry-factory');

var Map = Model.extend({
  defaults: {
    attribution: [config.get('cartodb_attributions')],
    center: [0, 0],
    zoom: 4,
    minZoom: 0,
    maxZoom: 20,
    scrollwheel: true,
    drag: true,
    keyboard: !util.supportsTouch(), // #cartodb.js/1652
    provider: 'leaflet',
    popupsEnabled: true,
    isFeatureInteractivityEnabled: false
  },

  initialize: function (attrs, options) {
    options = options || {};

    if (!options.layersFactory) throw new Error('layersFactory is required');
    this._layersFactory = options.layersFactory;

    attrs = attrs || {};

    this.layers = options.layersCollection || new Layers();
    this.geometries = new Backbone.Collection();

    var center = attrs.center || this.defaults.center;
    if (typeof center === 'string') {
      center = JSON.parse(center);
    }
    this.set({
      center: center,
      original_center: center
    });

    if (attrs.bounds) {
      this.set({
        view_bounds_sw: attrs.bounds[0],
        view_bounds_ne: attrs.bounds[1]
      });
      this.unset('bounds');
    } else {
      this.set({
        zoom: attrs.zoom || this.defaults.zoom
      });
    }

    this.layers.bind('reset', this._updateAttributions, this);
    this.layers.bind('add', this._updateAttributions, this);
    this.layers.bind('remove', this._updateAttributions, this);
    this.layers.bind('change:attribution', this._updateAttributions, this);
    this.layers.bind('reset', this._onLayersResetted, this);

    this._updateAttributions();
  },

  _onLayersResetted: function () {
    if (this.layers.size() >= 1) {
      this._adjustZoomtoLayer(this.layers.first());
    }
  },

  _updateAttributions: function () {
    var defaultCartoDBAttribution = this.defaults.attribution[0];
    var attributions = _.chain(this.layers.models)
      .map(function (layer) { return sanitize.html(layer.get('attribution')); })
      .reject(function (attribution) { return attribution === defaultCartoDBAttribution; })
      .compact()
      .uniq()
      .value();

    attributions.push(defaultCartoDBAttribution);

    this.set('attribution', attributions);
  },

  // PUBLIC API METHODS

  moveCartoDBLayer: function (from, to) {
    var layerMoved = this.layers.moveCartoDBLayer(from, to);
    if (layerMoved) {
      this.trigger('cartodbLayerMoved', {}, this);
    }
  },

  createCartoDBLayer: function (attrs, options) {
    this._checkProperties(attrs, ['sql|source', 'cartocss']);
    return this._addNewLayerModel('cartodb', attrs, options);
  },

  createTorqueLayer: function (attrs, options) {
    this._checkProperties(attrs, ['sql|source', 'cartocss']);
    return this._addNewLayerModel('torque', attrs, options);
  },

  createTileLayer: function (attrs, options) {
    this._checkProperties(attrs, ['urlTemplate']);
    return this._addNewLayerModel('tiled', attrs, options);
  },

  createWMSLayer: function (attrs, options) {
    this._checkProperties(attrs, ['urlTemplate']);
    return this._addNewLayerModel('wms', attrs, options);
  },

  createGMapsBaseLayer: function (attrs, options) {
    this._checkProperties(attrs, ['baseType']);
    return this._addNewLayerModel('gmapsbase', attrs, options);
  },

  createPlainLayer: function (attrs, options) {
    this._checkProperties(attrs, ['image|color']);
    return this._addNewLayerModel('plain', attrs, options);
  },

  _checkProperties: function (obj, requiredProperties) {
    var missingProperties = _.select(requiredProperties, function (property) {
      var properties = property.split('|');
      return _.all(properties, function (property) {
        return obj[property] === undefined;
      });
    });
    if (missingProperties.length) {
      throw new Error('The following attributes are missing: ' + missingProperties.join(','));
    }
  },

  _addNewLayerModel: function (type, attrs, options) {
    options = options || {};
    var layerModel = this._layersFactory.createLayer(type, attrs);
    this.listenTo(layerModel, 'destroy', this._removeLayerModelFromCollection);
    this.layers.add(layerModel, {
      silent: options.silent,
      at: options.at
    });

    return layerModel;
  },

  _removeLayerModelFromCollection: function (layerModel, collection, opts) {
    return this.layers.remove(layerModel, opts);
  },

  disableInteractivity: function () {
    this.disablePopups();
    this.disableFeatureInteractivity();
  },

  enableInteractivity: function () {
    this.enablePopups();
    this.enableFeatureInteractivity();
  },

  enableFeatureInteractivity: function () {
    this.set('isFeatureInteractivityEnabled', true);
  },

  disableFeatureInteractivity: function () {
    this.set('isFeatureInteractivityEnabled', false);
  },

  isFeatureInteractivityEnabled: function () {
    return !!this.get('isFeatureInteractivityEnabled');
  },

  enablePopups: function () {
    this.set('popupsEnabled', true);
  },

  disablePopups: function () {
    this.set('popupsEnabled', false);
  },

  arePopupsEnabled: function () {
    return !!this.get('popupsEnabled');
  },

  arePopupsDisabled: function () {
    return !this.arePopupsEnabled();
  },

  // GEOMETRY MANAGEMENT

  drawPoint: function () {
    return this._drawGeometry(GeometryFactory.createPoint({
      editable: true
    }));
  },

  drawPolyline: function () {
    return this._drawGeometry(GeometryFactory.createPolyline({
      editable: true
    }));
  },

  drawPolygon: function () {
    return this._drawGeometry(GeometryFactory.createPolygon({
      editable: true
    }));
  },

  _drawGeometry: function (geometry) {
    this.trigger('enterDrawingMode', geometry);
    return geometry;
  },

  stopDrawingGeometry: function () {
    this.trigger('exitDrawingMode');
  },

  editGeometry: function (geoJSON) {
    var geometry = GeometryFactory.createGeometryFromGeoJSON(geoJSON, {
      editable: true,
      expandable: true
    });
    this.trigger('enterEditMode', geometry);
    return geometry;
  },

  stopEditingGeometry: function (geoJSON) {
    this.trigger('exitEditMode');
  },

  // INTERNAL CartoDB.js METHODS

  setView: function (latlng, zoom) {
    this.set({
      center: latlng,
      zoom: zoom
    }, {
        silent: true
      });
    this.trigger('set_view');
  },

  setZoom: function (z) {
    this.set({
      zoom: z
    });
  },

  enableKeyboard: function () {
    this.set({
      keyboard: true
    });
  },

  disableKeyboard: function () {
    this.set({
      keyboard: false
    });
  },

  enableScrollWheel: function () {
    this.set({
      scrollwheel: true
    });
  },

  disableScrollWheel: function () {
    this.set({
      scrollwheel: false
    });
  },

  getZoom: function () {
    return this.get('zoom');
  },

  setCenter: function (latlng) {
    this.set({
      center: latlng
    });
  },

  /**
  * Change multiple options at the same time
  * @params {Object} New options object
  */
  setOptions: function (options) {
    if (typeof options !== 'object' || options.length) {
      if (this.options.debug) {
        throw (options + ' options has to be an object');
      } else {
        return;
      }
    }

    // Set options
    _.defaults(this.options, options);
  },

  /**
  * return getViewbounds if it is set
  */
  getViewBounds: function () {
    if (this.has('view_bounds_sw') && this.has('view_bounds_ne')) {
      return [
        this.get('view_bounds_sw'),
        this.get('view_bounds_ne')
      ];
    }
    return null;
  },

  getLayerAt: function (i) {
    return this.layers.at(i);
  },

  getLayerById: function (id) {
    return this.layers.get(id);
  },

  getLayerViewByLayerCid: function (cid) {
    return this.layers.get(cid);
  },

  _adjustZoomtoLayer: function (layer) {
    var maxZoom = parseInt(layer.get('maxZoom'), 10);
    var minZoom = parseInt(layer.get('minZoom'), 10);

    if (_.isNumber(maxZoom) && !_.isNaN(maxZoom)) {
      if (this.get('zoom') > maxZoom) this.set({ zoom: maxZoom, maxZoom: maxZoom });
      else this.set('maxZoom', maxZoom);
    }

    if (_.isNumber(minZoom) && !_.isNaN(minZoom)) {
      if (this.get('zoom') < minZoom) this.set({ minZoom: minZoom, zoom: minZoom });
      else this.set('minZoom', minZoom);
    }
  },

  addLayer: function (layer, opts) {
    if (this.layers.size() === 0) {
      this._adjustZoomtoLayer(layer);
    }
    this.layers.add(layer, opts);
    this.trigger('layerAdded');
    if (this.layers.length === 1) {
      this.trigger('firstLayerAdded');
    }
    return layer.cid;
  },

  removeLayer: function (layer) {
    this.layers.remove(layer);
  },

  removeLayerByCid: function (cid) {
    var layer = this.layers.get(cid);

    if (layer) this.removeLayer(layer);
    else log.error("There's no layer with cid = " + cid + '.');
  },

  removeLayerAt: function (i) {
    var layer = this.layers.at(i);

    if (layer) this.removeLayer(layer);
    else log.error("There's no layer in that position.");
  },

  clearLayers: function () {
    while (this.layers.length > 0) {
      this.removeLayer(this.layers.at(0));
    }
  },

  // by default the base layer is the layer at index 0
  getBaseLayer: function () {
    return this.layers.at(0);
  },

  /**
  * gets the url of the template of the tile layer
  * @method getLayerTemplate
  */
  getLayerTemplate: function () {
    var baseLayer = this.getBaseLayer();
    if (baseLayer && baseLayer.get('options')) {
      return baseLayer.get('options').urlTemplate;
    }
  },

  addGeometry: function (geom) {
    this.geometries.add(geom);
  },

  removeGeometry: function (geom) {
    this.geometries.remove(geom);
  },

  setBounds: function (b) {
    this.attributes.view_bounds_sw = [
      b[0][0],
      b[0][1]
    ];
    this.attributes.view_bounds_ne = [
      b[1][0],
      b[1][1]
    ];

    // change both at the same time
    this.trigger('change:view_bounds_ne', this);
  },

  // set center and zoom according to fit bounds
  fitBounds: function (bounds, mapSize) {
    var z = this.getBoundsZoom(bounds, mapSize);
    if (z === null) {
      return;
    }

    // project -> calculate center -> unproject
    var swPoint = Map.latlngToMercator(bounds[0], z);
    var nePoint = Map.latlngToMercator(bounds[1], z);

    var center = Map.mercatorToLatLng({
      x: (swPoint[0] + nePoint[0]) * 0.5,
      y: (swPoint[1] + nePoint[1]) * 0.5
    }, z);
    this.set({
      center: center,
      zoom: z
    });
  },

  // adapted from leaflat src
  // @return {Number, null} Calculated zoom from given bounds or the maxZoom if no appropriate zoom level could be found
  //   or null if given mapSize has no size.
  getBoundsZoom: function (boundsSWNE, mapSize) {
    // sometimes the map reports size = 0 so return null
    if (mapSize.x === 0 || mapSize.y === 0) {
      return null;
    }
    var size = [mapSize.x, mapSize.y];
    var zoom = this.get('minZoom') || 0;
    var maxZoom = this.get('maxZoom') || 24;
    var ne = boundsSWNE[1];
    var sw = boundsSWNE[0];
    var boundsSize = [];
    var nePoint;
    var swPoint;
    var zoomNotFound = true;

    do {
      zoom++;
      nePoint = Map.latlngToMercator(ne, zoom);
      swPoint = Map.latlngToMercator(sw, zoom);
      boundsSize[0] = Math.abs(nePoint[0] - swPoint[0]);
      boundsSize[1] = Math.abs(swPoint[1] - nePoint[1]);
      zoomNotFound = boundsSize[0] <= size[0] && boundsSize[1] <= size[1];
    } while (zoomNotFound && zoom <= maxZoom);

    if (zoomNotFound) {
      return maxZoom;
    }

    return zoom - 1;
  },

  setPixelToLatLngConverter: function (pixelToLatLngConverter) {
    this._pixelToLatLngConverter = pixelToLatLngConverter;
  },

  setLatLngToPixelConverter: function (latLngToPixelConverter) {
    this._latLngToPixelConverter = latLngToPixelConverter;
  },

  pixelToLatLng: function () {
    return this._pixelToLatLngConverter;
  },

  latLngToPixel: function () {
    return this._latLngToPixelConverter;
  },

  setMapViewSize: function (size) {
    this._mapViewSize = size;
    this.trigger('mapViewSizeChanged');
  },

  getMapViewSize: function () {
    return this._mapViewSize;
  },

  getEstimatedFeatureCount: function () {
    var acum = 0;
    var count = 0;
    var layers = this.layers.getCartoDBLayers();
    if (!layers) {
      return;
    }
    for (var i = 0; i < layers.length; i++) {
      count = layers[i].getEstimatedFeatureCount();
      if (count === undefined) {
        return;
      }
      acum += count;
    }
    return acum;
  },
}, {
    PROVIDERS: {
      GMAPS: 'googlemaps',
      LEAFLET: 'leaflet'
    },

    latlngToMercator: function (latlng, zoom) {
      var ll = new L.LatLng(latlng[0], latlng[1]);
      var pp = L.CRS.EPSG3857.latLngToPoint(ll, zoom);
      return [pp.x, pp.y];
    },

    mercatorToLatLng: function (point, zoom) {
      var ll = L.CRS.EPSG3857.pointToLatLng(point, zoom);
      return [ll.lat, ll.lng];
    }
  });

module.exports = Map;
