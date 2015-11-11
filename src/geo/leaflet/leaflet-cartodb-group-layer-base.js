var wax = require('wax.cartodb.js');
var L = require('leaflet');
var config = require('cdb.config');
var Profiler = require('cdb.core.Profiler');
var LeafletLayerView = require('./leaflet-layer-view');
var CartoDBLayerCommon = require('../cartodb-layer-common');
var CartoDBLogo = require('../cartodb-logo');

var LeafletCartoDBGroupLayerBase = L.TileLayer.extend({

  interactionClass: wax.leaf.interaction,

  includes: [
    LeafletLayerView.prototype,
    CartoDBLayerCommon.prototype
  ],

  options: {
    opacity:        0.99,
    attribution:    config.get('cartodb_attributions'),
    debug:          false,
    visible:        true,
    added:          false,
    tiler_domain:   "cartodb.com",
    tiler_port:     "80",
    tiler_protocol: "http",
    sql_api_domain:     "cartodb.com",
    sql_api_port:       "80",
    sql_api_protocol:   "http",
    maxZoom: 30, // default leaflet zoom level for a layers is 18, raise it
    extra_params:   {
    },
    cdn_url:        null,
    subdomains:     null
  },


  initialize: function (options) {
    options = options || {};
    // Set options
    L.Util.setOptions(this, options);

    this.fire = this.trigger;

    CartoDBLayerCommon.call(this);
    L.TileLayer.prototype.initialize.call(this);
    this.interaction = [];
    this.addProfiling();
  },

  addProfiling: function() {
    this.bind('tileloadstart', function(e) {
      var s = this.tileStats || (this.tileStats = {});
      s[e.tile.src] = Profiler.metric('cartodb-js.tile.png.load.time').start();
    });
    var finish = function(e) {
      var s = this.tileStats && this.tileStats[e.tile.src];
      s && s.end();
    };
    this.bind('tileload', finish);
    this.bind('tileerror', function(e) {
      Profiler.metric('cartodb-js.tile.png.error').inc();
      finish(e);
    });
  },


  // overwrite getTileUrl in order to
  // support different tiles subdomains in tilejson way
  getTileUrl: function (tilePoint) {
    var EMPTY_GIF = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    this._adjustTilePoint(tilePoint);

    var tiles = [EMPTY_GIF];
    if(this.tilejson) {
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
  setOpacity: function(opacity) {

    if (isNaN(opacity) || opacity>1 || opacity<0) {
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
  onAdd: function(map) {
    var self = this;
    this.options.map = map;

    // Add cartodb logo
    if (this.options.cartodb_logo != false)
      CartoDBLogo.addWadus({ left:8, bottom:8 }, 0, map._container);

    // TODO: We can probably move this to an initialize method
    this.model.bind('change:urls', function() {
      self.__update(function() {
        // if while the layer was processed in the server is removed
        // it should not be added to the map
        var id = L.stamp(self);
        if (!map._layers[id]) {
          return;
        }

        L.TileLayer.prototype.onAdd.call(self, map);
        self.fire('added');
        self.options.added = true;
      });
    });
  },


  /**
   * When removes the layer, destroy interactivity if exist
   */
  onRemove: function(map) {
    if(this.options.added) {
      this.options.added = false;
      L.TileLayer.prototype.onRemove.call(this, map);
    }
  },

  /**
   * Update CartoDB layer
   * generates a new url for tiles and refresh leaflet layer
   * do not collide with leaflet _update
   */
  __update: function(done) {
    var self = this;
    this.fire('updated');
    this.fire('loading');
    var map = this.options.map;

    var tilejson = self.model.get('urls');
    if(tilejson) {
      self.tilejson = tilejson;
      self.setUrl(self.tilejson.tiles[0]);
      // manage interaction
      self._reloadInteraction();
      self.ok && self.ok();
      done && done();
    } else {
      self.error && self.error(err);
      done && done();
    }
  },


  _checkLayer: function() {
    if (!this.options.added) {
      throw new Error('the layer is not still added to the map');
    }
  },

  /**
   * Set a new layer attribution
   * @params {String} New attribution string
   */
  setAttribution: function(attribution) {
    this._checkLayer();

    // Remove old one
    this.map.attributionControl.removeAttribution(this.options.attribution);

    // Set new attribution in the options
    this.options.attribution = attribution;

    // Change text
    this.map.attributionControl.addAttribution(this.options.attribution);

    // Change in the layer
    this.options.attribution = this.options.attribution;
    this.tilejson.attribution = this.options.attribution;

    this.fire('updated');
  },

  /**
   * Bind events for wax interaction
   * @param {Object} Layer map object
   * @param {Event} Wax event
   */
  _manageOnEvents: function(map, o) {
    var layer_point = this._findPos(map,o);

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
          return this.options.featureOver(o.e,latlng, screenPos, o.data, o.layer);
        }
        break;

      case 'click':
      case 'touchend':
      case 'touchmove': // for some reason android browser does not send touchend
      case 'mspointerup':
      case 'pointerup':
      case 'pointermove':
        if (this.options.featureClick) {
          this.options.featureClick(o.e,latlng, screenPos, o.data, o.layer);
        }
        break;
      default:
        break;
    }
  },


  /**
   * Bind off event for wax interaction
   */
  _manageOffEvents: function(map, o) {
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
        (o.e.clientX? o.e.clientX: x) - rect.left - obj.clientLeft - scrollX,
        (o.e.clientY? o.e.clientY: y) - rect.top - obj.clientTop - scrollY);
    }
    return map.containerPointToLayerPoint(point);
  },

  /**
   * Creates an instance of a Leaflet Point
   */
  _newPoint: function(x, y) {
    return new L.Point(x, y);
  },

  _modelUpdated: function() {
  }
});

module.exports = LeafletCartoDBGroupLayerBase;
