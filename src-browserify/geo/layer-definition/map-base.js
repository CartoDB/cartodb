var _ = require('underscore');
var util = require('cdb.core.util');
var profiler = require('cdb.core.profiler');
var MapProperties = require('./map-properties')

// NOTE this does not return a MapBase directly, but a wrapper, to inject the dependencies
// e.g. var MapBase = require('./map-base')({ jqueryAjax: $.ajax }});
// @param {Object} SubLayerFactory
// @param {Object} opts either of the options must be provided
//   jQueryAjax: {Object} (optional) typically $.ajax
//   reqwestCompat: {Object} (optional) typically reqwest.compat
module.exports = function(SubLayerFactory, opts) {
  if (!SubLayerFactory) throw new Error('SubLayerFactory is required');
  if (!opts.jQueryAjax && !opts.reqwestCompat) throw new Error('opts.jQueryAjax or opts.reqwestCompat is required');

  function MapBase(options) {
    var self = this;

    this.options = _.defaults(options, {
      ajax: opts.jQueryAjax || opts.reqwestCompat,
      pngParams: ['map_key', 'api_key', 'cache_policy', 'updated_at'],
      gridParams: ['map_key', 'api_key', 'cache_policy', 'updated_at'],
      cors: util.isCORSSupported(),
      MAX_GET_SIZE: 2033,
      force_cors: false,
      instanciateCallback: function() {
        return '_cdbc_' + self._callbackName();
      }
    });

    this.mapProperties = null;
    this.urls = null;
    this.silent = false;
    this.interactionEnabled = []; //TODO: refactor, include inside layer
    this._timeout = -1;
    this._createMapCallsStack = [];
    this._createMapCallbacks = [];
    this._waiting = false;
    this.lastTimeUpdated = null;
    this._refreshTimer = -1;

    // build template url
    if (!this.options.maps_api_template) {
      this._buildMapsApiTemplate(this.options);
    }
  }

  MapBase.BASE_URL = '/api/v1/map';
  MapBase.EMPTY_GIF = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  MapBase.prototype = {

    _buildMapsApiTemplate: function(opts) {
      var tilerProtocol = opts.tiler_protocol;
      var tilerDomain = opts.tiler_domain;
      var tilerPort = (opts.tiler_port != "") ? (":" + opts.tiler_port) : "";
      var username = opts.user_name ? "{user}." : "";
      opts.maps_api_template = [tilerProtocol, "://", username, tilerDomain, tilerPort].join('');
    },

    createMap: function(callback) {
      var self = this;
      function invokeStackedCallbacks(data, err) {
        var fn;
        while(fn = self._createMapCallbacks.pop()) {
          fn(data, err);
        }
      }
      clearTimeout(this._timeout);
      this._createMapCallsStack.push(invokeStackedCallbacks);
      this._createMapCallbacks.push(callback);
      this._timeout = setTimeout(function() {
        self._createMap(invokeStackedCallbacks);
      }, 4);
    },

    _createMap: function(callback) {
      var self = this;
      callback = callback || function() {};

      // if the previous request didn't finish, queue it
      if(this._waiting) {
        return this;
      }

      this._createMapCallsStack = [];

      // when it's a named map the number of layers is not known
      // so fetch the map
      if (!this.named_map && this.visibleLayers().length === 0) {
        callback(null);
        return;
      }

      // mark as the request is being done
      this._waiting = true;
      var req = null;
      if (this._usePOST()) {
        req = this._requestPOST;
      } else {
        req = this._requestGET;
      }
      var params = this._getParamsFromOptions(this.options);
      req.call(this, params, callback);
      return this;
    },

    _getParamsFromOptions: function(options) {
      var params = [];
      var extra_params = options.extra_params || {};
      var api_key = options.map_key || options.api_key || extra_params.map_key || extra_params.api_key;

      if(api_key) {
        params.push("map_key=" + api_key);
      }

      if(extra_params.auth_token) {
        if (_.isArray(extra_params.auth_token)) {
          for (var i = 0, len = extra_params.auth_token.length; i < len; i++) {
            params.push("auth_token[]=" + extra_params.auth_token[i]);
          }
        } else {
          params.push("auth_token=" + extra_params.auth_token);
        }
      }

      if (this.stat_tag) {
        params.push("stat_tag=" + this.stat_tag);
      }
      return params;
    },

    _usePOST: function() {
      if (this.options.cors) {
        if (this.options.force_cors) {
          return true;
        }
        // check payload size
        var payload = JSON.stringify(this.toJSON());
        if (payload.length > this.options.MAX_GET_SIZE) {
          return true;
        }
      }
      return false;
    },

    _requestPOST: function(params, callback) {
      var self = this;
      var ajax = this.options.ajax;

      var loadingTime = profiler.metric('cartodb-js.layergroup.post.time').start();

      ajax({
        crossOrigin: true,
        type: 'POST',
        method: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        url: this._tilerHost() + this.endPoint + (params.length ? "?" + params.join('&'): ''),
        data: JSON.stringify(this.toJSON()),
        success: function(data) {
          loadingTime.end();
          // discard previous calls when there is another call waiting
          if(0 === self._createMapCallsStack.length) {
            if (data.errors) {
              profiler.metric('cartodb-js.layergroup.post.error').inc();
              callback(null, data);
            } else {
              callback(data);
            }
          }

          self._requestFinished();
        },
        error: function(xhr) {
          loadingTime.end();
          profiler.metric('cartodb-js.layergroup.post.error').inc();
          var err = { errors: ['unknow error'] };
          if (xhr.status === 0) {
            err = { errors: ['connection error'] };
          }
          try {
            err = JSON.parse(xhr.responseText);
          } catch(e) {}
          if(0 === self._createMapCallsStack.length) {
            callback(null, err);
          }
          self._requestFinished();
        }
      });
    },

    _requestGET: function(params, callback) {
      var self = this;
      var ajax = this.options.ajax;
      var json = JSON.stringify(this.toJSON());
      var compressor = this._getCompressor(json);
      var endPoint = self.JSONPendPoint || self.endPoint;
      compressor(json, 3, function(encoded) {
        params.push(encoded);
        var loadingTime = profiler.metric('cartodb-js.layergroup.get.time').start();
        var host = self.options.dynamic_cdn ? self._host(): self._tilerHost();
        ajax({
          dataType: 'jsonp',
          url: host + endPoint + '?' + params.join('&'),
          jsonpCallback: self.options.instanciateCallback,
          cache: !!self.options.instanciateCallback,
          success: function(data) {
            loadingTime.end();
            if(0 === self._createMapCallsStack.length) {
              // check for errors
              if (data.errors) {
                profiler.metric('cartodb-js.layergroup.get.error').inc();
                callback(null, data);
              } else {
                callback(data);
              }
            }
            self._requestFinished();
          },
          error: function(data) {
            loadingTime.end();
            profiler.metric('cartodb-js.layergroup.get.error').inc();
            var err = { errors: ['unknow error'] };
            try {
              err = JSON.parse(xhr.responseText);
            } catch(e) {}
            if(0 === self._createMapCallsStack.length) {
              callback(null, err);
            }
            self._requestFinished();
          }
        });
      });
    },

    // returns the compressor depending on the size
    // of the layer
    _getCompressor: function(payload) {
      var self = this;
      if (this.options.compressor) {
        return this.options.compressor;
      }

      payload = payload || JSON.stringify(this.toJSON());
      if (!this.options.force_compress && payload.length < this.options.MAX_GET_SIZE) {
        return function(data, level, callback) {
          callback("config=" + encodeURIComponent(data));
        };
      }

      return function(data, level, callback) {
        data = JSON.stringify({ config: data });
        LZMA.compress(data, level, function(encoded) {
          callback("lzma=" + encodeURIComponent(util.array2hex(encoded)));
        });
      };

    },

    _requestFinished: function() {
      var self = this;
      this._waiting = false;
      this.lastTimeUpdated = new Date().getTime();

      // refresh layer when invalidation time has passed
      clearTimeout(this._refreshTimer);
      this._refreshTimer = setTimeout(function() {
        self.invalidate();
      }, this.options.refreshTime || (60*120*1000)); // default layergroup ttl

      // check request queue
      if(this._createMapCallsStack.length) {
        var request = this._createMapCallsStack.pop();
        this._createMap(request);
      }
    },

    fetchAttributes: function(layer_index, feature_id, columnNames, callback) {
      this._attrCallbackName = this._attrCallbackName || this._callbackName();
      var ajax = this.options.ajax;
      var loadingTime = profiler.metric('cartodb-js.named_map.attributes.time').start();
      ajax({
        dataType: 'jsonp',
        url: this._attributesUrl(layer_index, feature_id),
        jsonpCallback: '_cdbi_layer_attributes_' + this._attrCallbackName,
        cache: true,
        success: function(data) {
          loadingTime.end();
          callback(data);
        },
        error: function(data) {
          loadingTime.end();
          profiler.metric('cartodb-js.named_map.attributes.error').inc();
          callback(null);
        }
      });
    },

    _callbackName: function() {
      return util.uniqueCallbackName(JSON.stringify(this.toJSON()));
    },

    _attributesUrl: function(layer, feature_id) {
      var host = this._host();
      var url = [
        host,
        MapBase.BASE_URL.slice(1),
        this.mapProperties.getMapId(),
        this.mapProperties.getLayerIndexByType(this.getLayerIndexByNumber(layer), "mapnik"),
        'attributes',
        feature_id].join('/');

      var extra_params = this.options.extra_params || {};
      var token = extra_params.auth_token;
      if (token) {
        if (_.isArray(token)) {
          var tokenParams = [];
          for (var i = 0, len = token.length; i < len; i++) {
            tokenParams.push("auth_token[]=" + token[i]);
          }
          url += "?" + tokenParams.join('&')
        } else {
          url += "?auth_token=" + token
        }
      }
      return url;
    },

    invalidate: function() {
      this.mapProperties = null;
      this.urls = null;
      this.onLayerDefinitionUpdated();
    },

    getTiles: function(callback) {
      var self = this;
      if(self.mapProperties) {
        callback && callback(self._layerGroupTiles(self.mapProperties, self.options.extra_params));
        return this;
      }
      this.createMap(function(data, err) {
        if(data) {
          self.mapProperties = new MapProperties(data);
          // if cdn_url is present, use it
          if (data.cdn_url) {
            self.options.cdn_url = self.options.cdn_url || {}
            self.options.cdn_url = {
              http: data.cdn_url.http || self.options.cdn_url.http,
              https: data.cdn_url.https || self.options.cdn_url.https
            }
          }
          self.urls = self._layerGroupTiles(self.mapProperties, self.options.extra_params);
          callback && callback(self.urls);
        } else {
          if ((self.named_map !== null) && (err) ){
            callback && callback(null, err);
          } else if (self.visibleLayers().length === 0) {
            callback && callback({
              tiles: [MapBase.EMPTY_GIF],
              grids: []
            });
            return;
          }
        }
      });
      return this;
    },

    isHttps: function() {
      return this.options.maps_api_template.indexOf('https') === 0;
    },

    _layerGroupTiles: function(mapProperties, params) {
      var grids = [];
      var tiles = [];
      var pngParams = this._encodeParams(params, this.options.pngParams);
      var gridParams = this._encodeParams(params, this.options.gridParams);
      var subdomains = this.options.subdomains || ['0', '1', '2', '3'];
      if(this.isHttps()) {
        subdomains = [null]; // no subdomain
      }

      var layerIndexes = mapProperties.getLayerIndexesByType(this.options.filter);
      if (layerIndexes.length) {
        var tileTemplate = '/' +  layerIndexes.join(',') +'/{z}/{x}/{y}';
        var gridTemplate = '/{z}/{x}/{y}';

        for(var i = 0; i < subdomains.length; ++i) {
          var s = subdomains[i];
          var cartodb_url = this._host(s) + MapBase.BASE_URL + '/' + mapProperties.getMapId();
          tiles.push(cartodb_url + tileTemplate + ".png" + (pngParams ? "?" + pngParams: '') );

          for(var layer = 0; layer < this.layers.length; ++layer) {
            var index = mapProperties.getLayerIndexByType(layer, "mapnik");
            grids[layer] = grids[layer] || [];
            grids[layer].push(cartodb_url + "/" + index +  gridTemplate + ".grid.json" + (gridParams ? "?" + gridParams: ''));
          }
        }
      } else {
        tiles = [MapBase.EMPTY_GIF];
      }

      return {
        tiles: tiles,
        grids: grids
      }
    },

    /**
     * Change query of the tiles
     * @params {str} New sql for the tiles
     */
    _encodeParams: function(params, included) {
      if(!params) return '';
      var url_params = [];
      included = included || _.keys(params);
      for(var i in included) {
        var k = included[i]
        var p = params[k];
        if(p) {
          if (_.isArray(p)) {
            for (var j = 0, len = p.length; j < len; j++) {
              url_params.push(k + "[]=" + encodeURIComponent(p[j]));
            }
          } else {
            var q = encodeURIComponent(p);
            q = q.replace(/%7Bx%7D/g,"{x}").replace(/%7By%7D/g,"{y}").replace(/%7Bz%7D/g,"{z}");
            url_params.push(k + "=" + q);
          }
        }
      }
      return url_params.join('&')
    },

    onLayerDefinitionUpdated: function() {},

    setSilent: function(b) {
      this.silent = b;
    },

    _definitionUpdated: function() {
      if(this.silent) return;
      this.invalidate();
    },

    /**
     * get tile json for layer
     */
    getTileJSON: function(layer, callback) {
      layer = layer == undefined ? 0: layer;
      var self = this;
      this.getTiles(function(urls) {
        if(!urls) {
          callback(null);
          return;
        }
        if(callback) {
          callback(self._tileJSONfromTiles(layer, urls));
        }
      });
    },

    _tileJSONfromTiles: function(layer, urls, options) {
      options = options || {};
      var subdomains = options.subdomains || ['0', '1', '2', '3'];

      function replaceSubdomain(t) {
        var tiles = [];
        for (var i = 0; i < t.length; ++i) {
          tiles.push(t[i].replace('{s}', subdomains[i % subdomains.length]));
        }
        return tiles;
      }

      return {
        tilejson: '2.0.0',
        scheme: 'xyz',
        grids: replaceSubdomain(urls.grids[layer]),
        tiles: replaceSubdomain(urls.tiles),
        formatter: function(options, data) { return data; }
       };
    },

    _tilerHost: function() {
      var opts = this.options;
      return opts.maps_api_template.replace('{user}', opts.user_name);
    },

    _host: function(subhost) {
      var opts = this.options;
      var cdn_host = opts.cdn_url;
      var has_empty_cdn = !cdn_host || (cdn_host && (!cdn_host.http && !cdn_host.https));

      if (opts.no_cdn || has_empty_cdn) {
        return this._tilerHost();
      } else {
        var protocol = this.isHttps() ? 'https': 'http';
        var h = protocol + "://";
        if (subhost) {
          h += subhost + ".";
        }

        var cdn_url = cdn_host[protocol];
        // build default template url if the cdn url is not templatized
        // this is for backwards compatiblity, ideally we should use the url
        // that tiler sends to us right away
        if (!this._isUserTemplateUrl(cdn_url)) {
          cdn_url = cdn_url  + "/{user}";
        }
        h += cdn_url.replace('{user}', opts.user_name)

        return h;
      }
    },

    _isUserTemplateUrl: function(t) {
      return t && t.indexOf('{user}') !== -1;
    },

    // Methods to operate with layers
    getLayer: function(index) {
      return _.clone(this.layers[index]);
    },

    getLayerCount: function() {
      return this.layers ? this.layers.length: 0;
    },

    // given number inside layergroup
    // returns the real index in tiler layergroup`
    getLayerIndexByNumber: function(number) {
      var layers = {}
      var c = 0;
      for(var i = 0; i < this.layers.length; ++i) {
        var layer = this.layers[i];
        layers[i] = c;
        if(layer.options && !layer.options.hidden) {
          ++c;
        }
      }
      return layers[number];
    },

    /**
     * return the layer number by index taking into
     * account the hidden layers.
     */
    getLayerNumberByIndex: function(index) {
      var layers = [];
      for(var i = 0; i < this.layers.length; ++i) {
        var layer = this.layers[i];
        if(this._isLayerVisible(layer)) {
          layers.push(i);
        }
      }
      if (index >= layers.length) {
        return -1;
      }
      return +layers[index];
    },

    visibleLayers: function() {
      var layers = [];
      for(var i = 0; i < this.layers.length; ++i) {
        var layer = this.layers[i];
        if (this._isLayerVisible(layer)) {
          layers.push(layer);
        }
      }
      return layers;
    },

    _isLayerVisible: function(layer) {
      if (layer.options && 'hidden' in layer.options) {
        return !layer.options.hidden;
      }

      return layer.visible !== false;
    },

    setLayer: function(layer, def) {
      if(layer < this.getLayerCount() && layer >= 0) {
        if (def.options.hidden) {
          var i = this.interactionEnabled[layer];
          if (i) {
            def.interaction = true
            this.setInteraction(layer, false);
          }
        } else {
          if (this.layers[layer].interaction) {
            this.setInteraction(layer, true);
            delete this.layers[layer].interaction;
          }
        }
        this.layers[layer] = _.clone(def);
      }
      this.invalidate();
      return this;
    },

    getTooltipData: function(layer) {
      var tooltip = this.layers[layer].tooltip;
      if (tooltip && tooltip.fields && tooltip.fields.length) {
        return tooltip;
      }
      return null;
    },

    getInfowindowData: function(layer) {
      var lyr;
      var infowindow = this.layers[layer].infowindow;
      if (!infowindow && this.options.layer_definition && (lyr = this.options.layer_definition.layers[layer])) {
        infowindow = lyr.infowindow;
      }
      if (infowindow && infowindow.fields && infowindow.fields.length > 0) {
        return infowindow;
      }
      return null;
    },

    containInfowindow: function() {
      var layers =  this.options.layer_definition.layers;
      for(var i = 0; i < layers.length; ++i) {
        var infowindow = layers[i].infowindow;
        if (infowindow && infowindow.fields && infowindow.fields.length > 0) {
          return true;
        }
      }
      return false;
    },

    containTooltip: function() {
      var layers =  this.options.layer_definition.layers;
      for(var i = 0; i < layers.length; ++i) {
        var tooltip = layers[i].tooltip;
        if (tooltip && tooltip.fields && tooltip.fields.length) {
          return true;
        }
      }
      return false;
    },

    getSubLayer: function(index) {
      var layer = this.layers[index];
      layer.sub = layer.sub || SubLayerFactory.createSublayer(layer.type, this, index);
      return layer.sub;
    },

    getSubLayerCount: function() {
      return this.getLayerCount();
    },

    getSubLayers: function() {
      var layers = []
      for (var i = 0; i < this.getSubLayerCount(); ++i) {
        layers.push(this.getSubLayer(i))
      }
      return layers;
    }
  };

  return MapBase;
};
