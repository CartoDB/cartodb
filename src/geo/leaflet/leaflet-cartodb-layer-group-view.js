var L = require('leaflet');
// NOTE: Leaflet needs to be required before wax because wax relies on global L internally
var wax = require('wax.cartodb.js');
var config = require('cdb.config');
var Profiler = require('cdb.core.Profiler');
var LeafletLayerView = require('./leaflet-layer-view');
var CartoDBLayerCommon = require('../cartodb-layer-common');
var _ = require('underscore');
var Backbone = require('backbone');

var LeafletCartoDBLayerGroupView = L.TileLayer.extend({
  includes: [
    Backbone.Events,
    LeafletLayerView.prototype,
    CartoDBLayerCommon.prototype
  ],

  interactionClass: wax.leaf.interaction,

  options: {
    opacity: 0.99,
    attribution: config.get('cartodb_attributions'),
    debug: false,
    visible: true,
    added: false,
    tiler_domain: 'cartodb.com',
    tiler_port: '80',
    tiler_protocol: 'http',
    sql_api_domain: 'cartodb.com',
    sql_api_port: '80',
    sql_api_protocol: 'http',
    maxZoom: 30, // default leaflet zoom level for a layers is 18, raise it
    extra_params: {
    },
    cdn_url: null,
    subdomains: null
  },

  initialize: function (layerModel, leafletMap) {
    var self = this;
    var hovers = [];
    this.interaction = [];

    // TODO: Be more explicit about the options that are really used by the L.TileLayer
    var opts = _.clone(layerModel.attributes);

    opts.map = leafletMap;

    // preserve the user's callbacks
    var _featureOver = opts.featureOver;
    var _featureOut = opts.featureOut;
    var _featureClick = opts.featureClick;

    var previousEvent;
    var eventTimeout = -1;

    opts.featureOver = function (e, latlon, pxPos, data, layer) {
      if (!hovers[layer]) {
        self.trigger('layerenter', e, latlon, pxPos, data, layer);
      }
      hovers[layer] = 1;
      _featureOver && _featureOver.apply(this, arguments);
      self.featureOver && self.featureOver.apply(self, arguments);
      // if the event is the same than before just cancel the event
      // firing because there is a layer on top of it
      if (e.timeStamp === previousEvent) {
        clearTimeout(eventTimeout);
      }
      eventTimeout = setTimeout(function () {
        self.trigger('mouseover', e, latlon, pxPos, data, layer);
        self.trigger('layermouseover', e, latlon, pxPos, data, layer);
      }, 0);
      previousEvent = e.timeStamp;
    };

    opts.featureOut = function (m, layer) {
      if (hovers[layer]) {
        self.trigger('layermouseout', layer);
      }
      hovers[layer] = 0;
      if (!_.any(hovers)) {
        self.trigger('mouseout');
      }
      _featureOut && _featureOut.apply(this, arguments);
      self.featureOut && self.featureOut.apply(self, arguments);
    };

    opts.featureClick = _.debounce(function () {
      _featureClick && _featureClick.apply(self, arguments);
      self.featureClick && self.featureClick.apply(self, arguments);
    }, 10);

    // Set options
    L.Util.setOptions(this, opts);

    this.fire = this.trigger;

    // Bind changes to the urls of the model
    layerModel.bind('change:urls', this._onTileJSONChange, this);

    this.addProfiling();

    CartoDBLayerCommon.call(this);
    L.TileLayer.prototype.initialize.call(this);
    LeafletLayerView.call(this, layerModel, this, leafletMap);
  },

  featureOver: function (e, latlon, pixelPos, data, layer) {
    // dont pass leaflet lat/lon
    this.trigger('featureOver', e, [latlon.lat, latlon.lng], pixelPos, data, layer);
  },

  featureOut: function (e, layer) {
    this.trigger('featureOut', e, layer);
  },

  featureClick: function (e, latlon, pixelPos, data, layer) {
    // dont pass leaflet lat/lon
    this.trigger('featureClick', e, [latlon.lat, latlon.lng], pixelPos, data, layer);
  },

  error: function (e) {
    this.trigger('error', e ? (e.errors || e) : 'unknown error');
    this.model.trigger('error', e ? e.errors : 'unknown error');
  },

  ok: function (e) {
    this.model.trigger('tileOk');
  },

  addProfiling: function () {
    this.bind('tileloadstart', function (e) {
      var s = this.tileStats || (this.tileStats = {});
      s[e.tile.src] = Profiler.metric('cartodb-js.tile.png.load.time').start();
    });
    var finish = function (e) {
      var s = this.tileStats && this.tileStats[e.tile.src];
      s && s.end();
    };
    this.bind('tileload', finish);
    this.bind('tileerror', function (e) {
      Profiler.metric('cartodb-js.tile.png.error').inc();
      finish(e);
    });
  },

  // overwrite getTileUrl in order to
  // support different tiles subdomains in tilejson way
  getTileUrl: function (tilePoint) {
    var EMPTY_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    this._adjustTilePoint(tilePoint);

    var tiles = [EMPTY_GIF];
    if (this.tilejson) {
      tiles = this.tilejson.tiles;
    }

    var index = (tilePoint.x + tilePoint.y) % tiles.length;

    return L.Util.template(tiles[index], L.Util.extend({
      z: this._getZoomForUrl(),
      x: tilePoint.x,
      y: tilePoint.y
    }, this.options));
  },

  /**
   * Change opacity of the layer
   * @params {Integer} New opacity
   */
  setOpacity: function (opacity) {
    if (isNaN(opacity) || opacity > 1 || opacity < 0) {
      throw new Error(opacity + ' is not a valid value');
    }

    // Leaflet only accepts 0-0.99... Weird!
    this.options.opacity = Math.min(opacity, 0.99);

    if (this.options.visible) {
      L.TileLayer.prototype.setOpacity.call(this, this.options.opacity);
      this.fire('updated');
    }
  },

  /**
   * When Leaflet adds the layer... go!
   * @params {map}
   */
  onAdd: function (map) {
    this.options.map = map;
    this.options.added = true;
    return L.TileLayer.prototype.onAdd.call(this, map);
  },

  /**
   * When removes the layer, destroy interactivity if exist
   */
  onRemove: function (map) {
    if (this.options.added) {
      this.options.added = false;
      L.TileLayer.prototype.onRemove.call(this, map);
    }
  },

  /**
   * On tileJSON change,
   * it generates a new url for tiles and refresh leaflet layer
   * do not collide with leaflet _update
   */
  _onTileJSONChange: function () {
    var tilejson = this.model.get('urls');
    if (tilejson) {
      this.tilejson = tilejson;
      this.setUrl(this.tilejson.tiles[0]);
      // manage interaction
      this._reloadInteraction();
      // TODO: Is this necessary?
      this.ok && this.ok();
    } else {
      this.error && this.error('URLs have not been fetched yet');
    }
  },

  /**
   * Bind events for wax interaction
   * @param {Object} Layer map object
   * @param {Event} Wax event
   */
  _manageOnEvents: function (map, o) {
    var layer_point = this._findPos(map, o);

    if (!layer_point || isNaN(layer_point.x) || isNaN(layer_point.y)) {
      // If layer_point doesn't contain x and y,
      // we can't calculate event map position
      return false;
    }

    var latlng = map.layerPointToLatLng(layer_point);
    var event_type = o.e.type.toLowerCase();
    var screenPos = map.layerPointToContainerPoint(layer_point);

    switch (event_type) {
      case 'mousemove':
        if (this.options.featureOver) {
          return this.options.featureOver(o.e, latlng, screenPos, o.data, o.layer);
        }
        break;

      case 'click':
      case 'touchend':
      case 'touchmove': // for some reason android browser does not send touchend
      case 'mspointerup':
      case 'pointerup':
      case 'pointermove':
        if (this.options.featureClick) {
          this.options.featureClick(o.e, latlng, screenPos, o.data, o.layer);
        }
        break;
      default:
        break;
    }
  },

  /**
   * Bind off event for wax interaction
   */
  _manageOffEvents: function (map, o) {
    if (this.options.featureOut) {
      return this.options.featureOut && this.options.featureOut(o.e, o.layer);
    }
  },

  /**
   * Get the Leaflet Point of the event
   * @params {Object} Map object
   * @params {Object} Wax event object
   */
  _findPos: function (map, o) {
    var curleft = 0;
    var curtop = 0;
    var obj = map.getContainer();

    var x, y;
    if (o.e.changedTouches && o.e.changedTouches.length > 0) {
      x = o.e.changedTouches[0].clientX + window.scrollX;
      y = o.e.changedTouches[0].clientY + window.scrollY;
    } else {
      x = o.e.clientX;
      y = o.e.clientY;
    }

    // If the map is fixed at the top of the window, we can't use offsetParent
    // cause there might be some scrolling that we need to take into account.
    if (obj.offsetParent && obj.offsetTop > 0) {
      do {
        curleft += obj.offsetLeft;
        curtop += obj.offsetTop;
      } while (obj = obj.offsetParent);
      var point = this._newPoint(
        x - curleft, y - curtop);
    } else {
      var rect = obj.getBoundingClientRect();
      var scrollX = (window.scrollX || window.pageXOffset);
      var scrollY = (window.scrollY || window.pageYOffset);
      var point = this._newPoint(
        (o.e.clientX ? o.e.clientX : x) - rect.left - obj.clientLeft - scrollX,
        (o.e.clientY ? o.e.clientY : y) - rect.top - obj.clientTop - scrollY);
    }
    return map.containerPointToLayerPoint(point);
  },

  /**
   * Creates an instance of a Leaflet Point
   */
  _newPoint: function (x, y) {
    return new L.Point(x, y);
  },

  _modelUpdated: function () {}
});

module.exports = LeafletCartoDBLayerGroupView;
