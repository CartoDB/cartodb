var _ = require('underscore');
var GMapsLayerView = require('./gmaps-layer-view');
require('leaflet');
// NOTE: Leaflet needs to be required before wax because wax relies on global L internally
var wax = require('wax.cartodb.js');
var CartoDBDefaultOptions = require('./cartodb-default-options');
var Projector = require('./projector');
var CartoDBLayerCommon = require('../cartodb-layer-common');
var Profiler = require('cdb.core.Profiler');

var OPACITY_FILTER = 'progid:DXImageTransform.Microsoft.gradient(startColorstr=#00FFFFFF,endColorstr=#00FFFFFF)';

function setImageOpacityIE8 (img, opacity) {
  var v = Math.round(opacity * 100);
  if (v >= 99) {
    img.style.filter = OPACITY_FILTER;
  } else {
    img.style.filter = 'alpha(opacity=' + (opacity) + ');';
  }
}

var GMapsCartoDBLayerGroupView = function (layerModel, gmapsMap) {
  var self = this;
  var hovers = [];

  _.bindAll(this, 'featureOut', 'featureOver', 'featureClick');

  var opts = _.clone(layerModel.attributes);

  opts.map = gmapsMap;

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
    self.featureOver && self.featureOver.apply(this, arguments);

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
    self.featureOut && self.featureOut.apply(this, arguments);
  };

  opts.featureClick = _.debounce(function () {
    _featureClick && _featureClick.apply(this, arguments);
    self.featureClick && self.featureClick.apply(opts, arguments);
  }, 10);

  this.options = _.defaults(opts, CartoDBDefaultOptions);
  this.tiles = 0;
  this.tilejson = null;
  this.interaction = [];

  // Bind changes to the urls of the layer model
  layerModel.bind('change:urls', function () {
    this.update();
  }, this);

  wax.g.connector.call(this, opts);

  // lovely wax connector overwrites options so set them again
  // TODO: remove wax.connector here
  _.extend(this.options, opts);
  GMapsLayerView.call(this, layerModel, this, gmapsMap);
  this.projector = new Projector(opts.map);
  CartoDBLayerCommon.call(this);
};

// TODO: Do we need this?
GMapsCartoDBLayerGroupView.prototype = new wax.g.connector();
GMapsCartoDBLayerGroupView.prototype.interactionClass = wax.g.interaction;
_.extend(
  GMapsCartoDBLayerGroupView.prototype,
  GMapsCartoDBLayerGroupView.prototype,
  CartoDBLayerCommon.prototype,
  GMapsCartoDBLayerGroupView.prototype,
  GMapsLayerView.prototype,
  {
    reload: function () {
      this.model.invalidate();
    },

    remove: function () {
      GMapsLayerView.prototype.remove.call(this);
      this.clear();
    },

    featureOver: function (e, latlon, pixelPos, data, layer) {
      // dont pass gmaps LatLng
      this.trigger('featureOver', e, [latlon.lat(), latlon.lng()], pixelPos, data, layer);
    },

    featureOut: function (e, layer) {
      this.trigger('featureOut', e, layer);
    },

    featureClick: function (e, latlon, pixelPos, data, layer) {
      // dont pass leaflet lat/lon
      this.trigger('featureClick', e, [latlon.lat(), latlon.lng()], pixelPos, data, layer);
    },

    error: function (e) {
      if (this.model) {
        this.model.trigger('error', e ? e.errors : 'unknown error');
        this.model.trigger('tileError', e ? e.errors : 'unknown error');
      }
    },

    ok: function (e) {
      this.model.trigger('tileOk');
    },

    tilesOk: function (e) {
      this.model.trigger('tileOk');
    },

    loading: function () {
      this.trigger('loading');
    },

    finishLoading: function () {
      this.trigger('load');
    },

    setOpacity: function (opacity) {
      if (isNaN(opacity) || opacity > 1 || opacity < 0) {
        throw new Error(opacity + ' is not a valid value, should be in [0, 1] range');
      }
      this.opacity = this.options.opacity = opacity;
      for (var key in this.cache) {
        var img = this.cache[key];
        img.style.opacity = opacity;
        setImageOpacityIE8(img, opacity);
      }
    },

    getTile: function (coord, zoom, ownerDocument) {
      var EMPTY_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

      var self = this;
      var ie = 'ActiveXObject' in window,
        ielt9 = ie && !document.addEventListener;

      this.options.added = true;

      if (this.tilejson === null) {
        var key = zoom + '/' + coord.x + '/' + coord.y;
        var i = this.cache[key] = new Image(256, 256);
        i.src = EMPTY_GIF;
        i.setAttribute('gTileKey', key);
        i.style.opacity = this.options.opacity;
        return i;
      }

      var im = wax.g.connector.prototype.getTile.call(this, coord, zoom, ownerDocument);

      // in IE8 semi transparency does not work and needs filter
      if ( ielt9 ) {
        setImageOpacityIE8(im, this.options.opacity);
      }
      im.style.opacity = this.options.opacity;
      if (this.tiles === 0) {
        this.loading && this.loading();
      }

      this.tiles++;

      var loadTime = Profiler.metric('cartodb-js.tile.png.load.time').start();

      var finished = function () {
        loadTime.end();
        self.tiles--;
        if (self.tiles === 0) {
          self.finishLoading && self.finishLoading();
        }
      };
      im.onload = finished;
      im.onerror = function () {
        Profiler.metric('cartodb-js.tile.png.error').inc();
        finished();
      };

      return im;
    },

    onAdd: function () {},

    clear: function () {
      this._clearInteraction();
      self.finishLoading && self.finishLoading();
    },

    update: function (done) {
      this.loading && this.loading();

      var tilejson = this.model.get('urls');
      if (tilejson) {
        this.tilejson = tilejson;
        this.options.tiles = tilejson.tiles;
        this.tiles = 0;
        this.cache = {};
        this._reloadInteraction();
        this.refreshView();
        this.ok && this.ok();
        done && done();
      } else {
        this.error && this.error('URLs have not been fetched yet');
        done && done();
      }
    },

    refreshView: function () {
      var self = this;
      var map = this.options.map;
      map.overlayMapTypes.forEach(
        function (layer, i) {
          if (layer == self) {
            map.overlayMapTypes.setAt(i, self);
            return;
          }
        }
      );
    },

    _checkLayer: function () {
      if (!this.options.added) {
        throw new Error('the layer is not still added to the map');
      }
    },

    _findPos: function (map, o) {
      var curleft = 0;
      var curtop = 0;
      var obj = map.getDiv();

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
      return point;
    },

    /**
     * Creates an instance of a googleMaps Point
     */
    _newPoint: function (x, y) {
      return new google.maps.Point(x, y);
    },

    _manageOffEvents: function (map, o) {
      if (this.options.featureOut) {
        return this.options.featureOut && this.options.featureOut(o.e, o.layer);
      }
    },

    _manageOnEvents: function (map, o) {
      var point = this._findPos(map, o);
      var latlng = this.projector.pixelToLatLng(point);
      var event_type = o.e.type.toLowerCase();

      switch (event_type) {
        case 'mousemove':
          if (this.options.featureOver) {
            return this.options.featureOver(o.e, latlng, point, o.data, o.layer);
          }
          break;

        case 'click':
        case 'touchend':
        case 'touchmove': // for some reason android browser does not send touchend
        case 'mspointerup':
        case 'pointerup':
        case 'pointermove':
          if (this.options.featureClick) {
            this.options.featureClick(o.e, latlng, point, o.data, o.layer);
          }
          break;
        default:
          break;
      }
    }
  }
);

module.exports = GMapsCartoDBLayerGroupView;
