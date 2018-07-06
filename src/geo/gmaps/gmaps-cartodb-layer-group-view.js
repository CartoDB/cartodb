/* global Image, google */
var _ = require('underscore');
var GMapsLayerView = require('./gmaps-layer-view');
var zera = require('@carto/zera');

var C = require('../../constants');
var Projector = require('./projector');
var CartoDBLayerGroupViewBase = require('../cartodb-layer-group-view-base');
var Profiler = require('cdb.core.Profiler');

var OPACITY_FILTER = 'progid:DXImageTransform.Microsoft.gradient(startColorstr=#00FFFFFF,endColorstr=#00FFFFFF)';
var EMPTY_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

function setImageOpacityIE8 (img, opacity) {
  var v = Math.round(opacity * 100);
  if (v >= 99) {
    img.style.filter = OPACITY_FILTER;
  } else {
    img.style.filter = 'alpha(opacity=' + (opacity) + ');';
  }
}

function generateId () {
  return (((1 + Math.random()) * 0x100000000) | 0).toString(16).substring(1);
}

var GMapsCartoDBLayerGroupView = function (layerModel, options) {
  var self = this;
  var hovers = [];
  var gmapsMap = options.nativeMap;

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

  this.tiles = 0;

  this.options = {
    tiles: options.tiles,
    scheme: options.scheme || 'xyz',
    blankImage: options.blankImage || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
  };

  // internal id
  this._id = generateId();

  // non-configurable options
  this.interactive = true;
  this.tileSize = new google.maps.Size(256, 256);

  // DOM element cache
  this.cache = {};

  _.extend(this.options, opts);
  GMapsLayerView.apply(this, arguments);
  this.projector = new Projector(opts.map);
  CartoDBLayerGroupViewBase.apply(this, arguments);
};

GMapsCartoDBLayerGroupView.prototype.interactionClass = zera.Interactive;
_.extend(
  GMapsCartoDBLayerGroupView.prototype,
  CartoDBLayerGroupViewBase.prototype,
  GMapsLayerView.prototype,
  {
    addToMap: function () {
      this.gmapsMap.overlayMapTypes.setAt(0, this);
    },

    remove: function () {
      var overlayIndex = this._getOverlayIndex();

      if (overlayIndex >= 0) {
        this.gmapsMap.overlayMapTypes.removeAt(overlayIndex);
      }

      this._clearInteraction();
      this.finishLoading && this.finishLoading();
    },

    reload: function () {
      this.model.invalidate();
    },

    featureOver: function (e, latlon, pixelPos, data, layer) {
      var layerModel = this.model.getLayerInLayerGroupAt(layer);
      if (layerModel) {
        this.trigger('featureOver', {
          layer: layerModel,
          layerIndex: layer,
          latlng: [latlon.lat(), latlon.lng()],
          position: { x: pixelPos.x, y: pixelPos.y },
          feature: data
        });
      }
    },

    featureOut: function (e, layer) {
      var layerModel = this.model.getLayerInLayerGroupAt(layer);
      if (layerModel) {
        this.trigger('featureOut', {
          layer: layerModel,
          layerIndex: layer
        });
      }
    },

    featureClick: function (e, latlon, pixelPos, data, layer) {
      var layerModel = this.model.getLayerInLayerGroupAt(layer);
      if (layerModel) {
        this.trigger('featureClick', {
          layer: layerModel,
          layerIndex: layer,
          latlng: [latlon.lat(), latlon.lng()],
          position: { x: pixelPos.x, y: pixelPos.y },
          feature: data
        });
      }
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
      var self = this;
      var ie = 'ActiveXObject' in window;
      var ielt9 = ie && !document.addEventListener;

      this.options.added = true;
      if (!this.model.hasTileURLTemplates()) {
        var key = zoom + '/' + coord.x + '/' + coord.y;
        var image = this.cache[key] = new Image(256, 256);
        image.src = EMPTY_GIF;
        image.setAttribute('gTileKey', key);
        image.style.opacity = this.options.opacity;
        return image;
      }

      var tile = this._getTile(coord, zoom, ownerDocument);

      // in IE8 semi transparency does not work and needs filter
      if (ielt9) {
        setImageOpacityIE8(tile, this.options.opacity);
      }
      tile.style.opacity = this.options.opacity;
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

      tile.onload = finished;

      tile.onerror = function () {
        Profiler.metric('cartodb-js.tile.png.error').inc();
        self.model.addError({ type: C.WINDSHAFT_ERRORS.TILE });
        finished();
      };

      return tile;
    },

    // Get a tile element from a coordinate, zoom level, and an ownerDocument.
    _getTile: function (coord, zoom, ownerDocument) {
      var key = zoom + '/' + coord.x + '/' + coord.y;
      if (!this.cache[key]) {
        var img = this.cache[key] = new Image(256, 256);
        this.cache[key].src = this._getTileUrl(coord, zoom);
        this.cache[key].setAttribute('gTileKey', key);
        this.cache[key].onerror = function () { img.style.display = 'none'; };
      }
      return this.cache[key];
    },

    // Get a tile url, based on x, y coordinates and a z value.
    _getTileUrl: function (coord, z) {
      // Y coordinate is flipped in Mapbox, compared to Google
      var mod = Math.pow(2, z);
      var y = (this.options.scheme === 'tms') ? (mod - 1) - coord.y : coord.y;
      var x = (coord.x % mod);

      x = (x < 0) ? (coord.x % mod) + mod : x;

      if (y < 0) return this.options.blankImage;

      return this.options.tiles[parseInt(x + y, 10) % this.options.tiles.length]
        .replace(/\{z\}/g, z)
        .replace(/\{x\}/g, x)
        .replace(/\{y\}/g, y);
    },

    _reload: function () {
      var tileURLTemplates;
      if (this.model.hasTileURLTemplates()) {
        tileURLTemplates = [this.model.getTileURLTemplatesWithSubdomains()[0]];
      } else {
        tileURLTemplates = [EMPTY_GIF];
      }

      this.options.tiles = tileURLTemplates;
      this.tiles = 0;
      this.cache = {};
      this._reloadInteraction();
      this._refreshView();
    },

    _refreshView: function () {
      var overlays = this.gmapsMap.overlayMapTypes;
      var overlayIndex = this._getOverlayIndex();

      if (overlayIndex >= 0) {
        overlays.setAt(overlayIndex, overlays.getAt(overlayIndex));
      }
    },

    _checkLayer: function () {
      if (!this.options.added) {
        throw new Error('the layer is not still added to the map');
      }
    },

    _getOverlayIndex: function () {
      var overlays = this.gmapsMap.overlayMapTypes.getArray();

      return _.findIndex(overlays, function (overlay) {
        return overlay && overlay._id === this._id;
      }, this);
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
      var point = o.pixel;
      var latlng = this.projector.pixelToLatLng(point);
      var eventType = o.e.type.toLowerCase();

      switch (eventType) {
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
