
function Map(options) {
  var self = this;
  this.options = _.defaults(options, {
    ajax: window.$ ? window.$.ajax : reqwest.compat,
    pngParams: ['map_key', 'api_key', 'cache_policy', 'updated_at'],
    gridParams: ['map_key', 'api_key', 'cache_policy', 'updated_at'],
    cors: this.isCORSSupported(),
    btoa: this.isBtoaSupported() ? this._encodeBase64Native : this._encodeBase64,
    MAX_GET_SIZE: 2033,
    force_cors: false
  });

  this.layerToken = null;
  this.urls = null;
  this.silent = false;
  this.interactionEnabled = []; //TODO: refactor, include inside layer
  this._layerTokenQueue = [];
  this._timeout = -1;
  this._queue = [];
  this._waiting = false;
  this.lastTimeUpdated = null;
  this._refreshTimer = -1;
}

Map.BASE_URL = '/api/v1/map';
Map.EMPTY_GIF = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

function NamedMap(named_map, options) {
  var self = this;
  Map.call(this, options);
  this.options.pngParams.push('auth_token')
  this.options.gridParams.push('auth_token')
  this.endPoint = Map.BASE_URL + '/named/' + named_map.name;
  this.JSONPendPoint = Map.BASE_URL + '/named/' + named_map.name + '/jsonp';
  this.layers = _.clone(named_map.layers) || [];
  for(var i = 0; i < this.layers.length; ++i) {
    var layer = this.layers[i];
    layer.options = layer.options || { hidden: false };
    layer.options.layer_name = layer.layer_name;
  }
  this.named_map = named_map;
  var token = named_map.auth_token || options.auth_token;
  if (token) {
    this.setAuthToken(token);
  }
}

function LayerDefinition(layerDefinition, options) {
  var self = this;
  Map.call(this, options);
  this.endPoint = Map.BASE_URL;
  this.setLayerDefinition(layerDefinition, { silent: true });
}

/**
 * given a list of sublayers as:
 * {
 *   sql: '...',
 *   cartocss: '..',
 *   cartocss_version:'...', //optional
 *   interactivity: '...' //optional
 * }
 * returns the layer definition for version 1.0.0
 *
 * ``sublayers`` should be an array, an exception is thrown otherewise
 *
 */
LayerDefinition.layerDefFromSubLayers = function(sublayers) {

  if(!sublayers || sublayers.length === undefined) throw new Error("sublayers should be an array");

  var layer_definition = {
    version: '1.0.0',
    stat_tag: 'API',
    layers: []
  };

  for (var i = 0; i < sublayers.length; ++i) {
    layer_definition.layers.push({
      type: 'cartodb',
      options: sublayers[i]
    });
  }

  return layer_definition;
};

Map.prototype = {

  /*
   * TODO: extract these two functions to some core module
   */
  isCORSSupported: function() {
    return 'withCredentials' in new XMLHttpRequest();// || (typeof XDomainRequest !== "undefined";
  },

  isBtoaSupported: function() {
    return typeof window['btoa'] == 'function';
  },

  getLayerCount: function() {
    return this.layers.length;
  },

  _encodeBase64Native: function (input) {
    return btoa(input)
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
      if(layer.options && !layer.options.hidden) {
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
      if(!layer.options.hidden) {
        layers.push(layer);
      }
    }
    return layers;
  },


  // ie7 btoa,
  // from http://phpjs.org/functions/base64_encode/
  _encodeBase64: function (data) {
    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
      ac = 0,
      enc = "",
      tmp_arr = [];

    if (!data) {
      return data;
    }

    do { // pack three octets into four hexets
      o1 = data.charCodeAt(i++);
      o2 = data.charCodeAt(i++);
      o3 = data.charCodeAt(i++);

      bits = o1 << 16 | o2 << 8 | o3;

      h1 = bits >> 18 & 0x3f;
      h2 = bits >> 12 & 0x3f;
      h3 = bits >> 6 & 0x3f;
      h4 = bits & 0x3f;

      // use hexets to index into b64, and append result to encoded string
      tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
    } while (i < data.length);

    enc = tmp_arr.join('');

    var r = data.length % 3;
    return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
  },

  _array2hex: function(byteArr) {
    var encoded = []
    for(var i = 0; i < byteArr.length; ++i) {
      encoded.push(String.fromCharCode(byteArr[i] + 128));
    }
    return this.options.btoa(encoded.join(''))
  },

  getLayerToken: function(callback) {
    var self = this;
    function _done(data, err) {
      var fn;
      while(fn = self._layerTokenQueue.pop()) {
        fn(data, err);
      }
    }
    clearTimeout(this._timeout);
    this._queue.push(_done);
    this._layerTokenQueue.push(callback);
    this._timeout = setTimeout(function() {
      self._getLayerToken(_done);
    }, 4);
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
    if(this._queue.length) {
      var last = this._queue[this._queue.length - 1];
      this._getLayerToken(last);
    }
  },

  _requestPOST: function(params, callback) {
    var self = this;
    var ajax = this.options.ajax;

    var loadingTime = cartodb.core.Profiler.metric('cartodb-js.layergroup.post.time').start();

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
        if(0 === self._queue.length) {
          callback(data);
        }
        self._requestFinished();
      },
      error: function(xhr) {
        loadingTime.end();
        cartodb.core.Profiler.metric('cartodb-js.layergroup.post.error').inc();
        var err = { errors: ['unknow error'] };
        if (xhr.status === 0) {
          err = { errors: ['connection error'] };
        }
        try {
          err = JSON.parse(xhr.responseText);
        } catch(e) {}
        if(0 === self._queue.length) {
          callback(null, err);
        }
        self._requestFinished();
      }
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
        callback("lzma=" + encodeURIComponent(self._array2hex(encoded)));
      });
    };

  },

  _requestGET: function(params, callback) {
    var self = this;
    var ajax = this.options.ajax;
    var json = JSON.stringify(this.toJSON());
    var compressor = this._getCompressor(json);
    var endPoint = self.JSONPendPoint || self.endPoint;
    compressor(json, 3, function(encoded) {
      params.push(encoded);
      var loadingTime = cartodb.core.Profiler.metric('cartodb-js.layergroup.get.time').start();
      ajax({
        dataType: 'jsonp',
        url: self._tilerHost() + endPoint + '?' + params.join('&'),
        success: function(data) {
          loadingTime.end();
          if(0 === self._queue.length) {
            // check for errors
            if (data.error) {
              cartodb.core.Profiler.metric('cartodb-js.layergroup.get.error').inc();
              callback(null, data.error);
            } else {
              callback(data);
            }
          }
          self._requestFinished();
        },
        error: function(data) {
          loadingTime.end();
          cartodb.core.Profiler.metric('cartodb-js.layergroup.get.error').inc();
          var err = { errors: ['unknow error'] };
          try {
            err = JSON.parse(xhr.responseText);
          } catch(e) {}
          if(0 === self._queue.length) {
            callback(null, err);
          }
          self._requestFinished();
        }
      });
    });
  },

  _getLayerToken: function(callback) {
    var self = this;
    var params = [];
    callback = callback || function() {};

    // if the previous request didn't finish, queue it
    if(this._waiting) {
      return this;
    }

    this._queue = [];

    // when it's a named map the number of layers is not known
    // so fetch the map
    if (!this.named_map && this.visibleLayers().length === 0) {
      callback(null);
      return;
    }

    // setup params
    var extra_params = this.options.extra_params || {};
    var api_key = this.options.map_key || this.options.api_key || extra_params.map_key || extra_params.api_key;
    if(api_key) {
      params.push("map_key=" + api_key);
    }
    if(extra_params.auth_token) {
      params.push("auth_token=" + extra_params.auth_token);
    }
    // mark as the request is being done
    this._waiting = true;
    var req = null;
    if (this._usePOST()) {
      req = this._requestPOST;
    } else {
      req = this._requestGET;
    }
    req.call(this, params, callback);
    return this;
  },

  _usePOST: function() {
    if (this.options.cors) {
      if (this.options.force_cors) {
        return true;
      }
      // check payload size
      var payload = JSON.stringify(this.toJSON());
      if (payload < this.options.MAX_GET_SIZE) {
        return false;
      }
    }
    return false;
  },


  getLayer: function(index) {
    return _.clone(this.layers[index]);
  },

  invalidate: function() {
    this.layerToken = null;
    this.urls = null;
    this.onLayerDefinitionUpdated();
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


  getTiles: function(callback) {
    var self = this;
    if(self.layerToken) {
      callback && callback(self._layerGroupTiles(self.layerToken, self.options.extra_params));
      return this;
    }
    this.getLayerToken(function(data, err) {
      if(data) {
        self.layerToken = data.layergroupid;
        // if cdn_url is present, use it
        if (data.cdn_url) {
          var c = self.options.cdn_url = self.options.cdn_url || {};
          c.http = data.cdn_url.http || c.http;
          c.https = data.cdn_url.https || c.https;
        }
        self.urls = self._layerGroupTiles(data.layergroupid, self.options.extra_params);
        callback && callback(self.urls);
      } else {
        if (self.visibleLayers().length === 0) {
          callback && callback({
            tiles: [Map.EMPTY_GIF],
            grids: []
          });
          return;
        } 
        callback && callback(null, err);
      }
    });
    return this;
  },

  isHttps: function() {
    return this.options.tiler_protocol === 'https';
  },

  _layerGroupTiles: function(layerGroupId, params) {
    var subdomains = this.options.subdomains || ['0', '1', '2', '3'];
    if(this.isHttps()) {
      subdomains = [null]; // no subdomain
    }

    var tileTemplate = '/{z}/{x}/{y}';

    var grids = []
    var tiles = [];

    var pngParams = this._encodeParams(params, this.options.pngParams);
    for(var i = 0; i < subdomains.length; ++i) {
      var s = subdomains[i]
      var cartodb_url = this._host(s) + Map.BASE_URL + '/' + layerGroupId
      tiles.push(cartodb_url + tileTemplate + ".png" + (pngParams ? "?" + pngParams: '') );

      var gridParams = this._encodeParams(params, this.options.gridParams);
      for(var layer = 0; layer < this.layers.length; ++layer) {
        grids[layer] = grids[layer] || [];
        grids[layer].push(cartodb_url + "/" + layer +  tileTemplate + ".grid.json" + (gridParams ? "?" + gridParams: ''));
      }
    }

    return {
      tiles: tiles,
      grids: grids
    }

  },

  _cleanInteractivity: function(attributes) {
    if(!attributes) return;
    if(typeof(attributes) == 'string') {
      attributes = attributes.split(',');
    }

    for(var i = 0; i < attributes.length; ++i) {
      attributes[i] = attributes[i].replace(/ /g, '');
    }

    return attributes;
  },


  onLayerDefinitionUpdated: function() {},

  setSilent: function(b) {
    this.silent = b;
  },

  _definitionUpdated: function() {
    if(this.silent) return;
    this.invalidate();
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
        var q = encodeURIComponent(p);
        q = q.replace(/%7Bx%7D/g,"{x}").replace(/%7By%7D/g,"{y}").replace(/%7Bz%7D/g,"{z}");
        url_params.push(k + "=" + q);
      }
    }
    return url_params.join('&')
  },

  _tilerHost: function() {
    var opts = this.options;
    return opts.tiler_protocol +
         "://" + ((opts.user_name) ? opts.user_name+".":"")  +
         opts.tiler_domain +
         ((opts.tiler_port != "") ? (":" + opts.tiler_port) : "");
  },

  _host: function(subhost) {
    var opts = this.options;
    if (opts.no_cdn) {
      return this._tilerHost();
    } else {
      var h = opts.tiler_protocol + "://";
      if (subhost) {
        h += subhost + ".";
      }
      var cdn_host = opts.cdn_url || cdb.CDB_HOST;
      if(!cdn_host.http && !cdn_host.https) {
        throw new Error("cdn_host should contain http and/or https entries");
      }
      h += cdn_host[opts.tiler_protocol] + "/" + opts.user_name;
      return h;
    }
  },

  getTooltipData: function(layer) {
    return this.layers[layer].tooltip;
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
    layer.sub = layer.sub || new SubLayer(this, index);
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

NamedMap.prototype = _.extend({}, Map.prototype, {

  setAuthToken: function(token) {
    if(!this.isHttps()) {
      throw new Error("https must be used when auth_token is set");
    }
    this.options.extra_params = this.options.extra_params || {};
    this.options.extra_params.auth_token = token;
    this.invalidate();
    return this;
  },

  setParams: function(attr, v) {
    var params;
    if (arguments.length === 2) {
      params = {}
      params[attr] = v;
    } else {
      params = attr;
    }
    if (!this.named_map.params) {
      this.named_map.params = {};
    }
    for (var k in params) {
      if (params[k] === undefined || params[k] === null) {
        delete this.named_map.params[k];
      } else {
        this.named_map.params[k] = params[k];
      }
    }
    this.invalidate();
    return this;
  },

  toJSON: function() {
    var p = this.named_map.params || {};
    for(var i = 0; i < this.layers.length; ++i) {
      var layer = this.layers[i];
      if(layer.options.hidden) {
        p['layer' + i] = 0;
      } else {
        // when it's show just don't send it
        delete p['layer' + i];
      }
    }
    return p;
  },

  containInfowindow: function() {
      var layers = this.layers || [];
      for(var i = 0; i < layers.length; ++i) {
        var infowindow = layers[i].infowindow;
        if (infowindow && infowindow.fields && infowindow.fields.length > 0) {
          return true;
        }
      }
      return false;
  },

  containTooltip: function() {
    var layers = this.layers || [];
    for(var i = 0; i < layers.length; ++i) {
      var tooltip = layers[i].tooltip;
      if (tooltip) {
        return true;
      }
    }
    return false;
  },

  _attributesUrl: function(layer, feature_id) {
    // /api/maps/:map_id/:layer_index/attributes/:feature_id
    var url = [
      this._tilerHost(),
      //'api',
      //'v1',
      Map.BASE_URL.slice(1),
      this.layerToken,
      layer,
      'attributes',
      feature_id].join('/');

    var extra_params = this.options.extra_params || {};
    var token = extra_params.auth_token;
    if (token) {
      url += "?auth_token=" + token
    }
    return url;
  },

  // for named maps attributes are fetch from attributes service
  fetchAttributes: function(layer_index, feature_id, columnNames, callback) {
    var ajax = this.options.ajax;
    var loadingTime = cartodb.core.Profiler.metric('cartodb-js.named_map.attributes.time').start();
    ajax({
      dataType: 'jsonp',
      url: this._attributesUrl(layer_index, feature_id),
      success: function(data) {
        loadingTime.end()
        callback(data);
      },
      error: function(data) {
        loadingTime.end()
        cartodb.core.Profiler.metric('cartodb-js.named_map.attributes.error').inc();
        callback(null);
      }
    });
  },

  setSQL: function(sql) {
    throw new Error("SQL is read-only in NamedMaps");
  },

  setCartoCSS: function(sql) {
    throw new Error("cartocss is read-only in NamedMaps");
  },

  getCartoCSS: function() {
    throw new Error("cartocss can't be accessed in NamedMaps");
  },

  getSQL: function() {
    throw new Error("SQL can't be accessed in NamedMaps");
  },

  setLayer: function(layer, def) {
    var not_allowed_attrs = {'sql': 1, 'cartocss': 1, 'interactivity': 1 };

    for(var k in def.options) {
      if (k in not_allowed_attrs) {
        delete def.options[k];
        throw new Error( k + " is read-only in NamedMaps");
      }
    }
    return Map.prototype.setLayer.call(this, layer, def);
  },

  removeLayer: function(layer) {
    throw new Error("sublayers are read-only in Named Maps");
  },

  createSubLayer: function(attrs, options) {
    throw new Error("sublayers are read-only in Named Maps");
  }, 

  addLayer: function(def, layer) {
    throw new Error("sublayers are read-only in Named Maps");
  },

  // for named maps the layers are always the same (i.e they are
  // not removed to hide) so the number does not change
  getLayerIndexByNumber: function(number) {
    return +number;
  }


});

LayerDefinition.prototype = _.extend({}, Map.prototype, {

  setLayerDefinition: function(layerDefinition, options) {
    options = options || {};
    this.version = layerDefinition.version || '1.0.0';
    this.stat_tag = layerDefinition.stat_tag;
    this.layers = _.clone(layerDefinition.layers);
    if(!options.silent) {
      this._definitionUpdated();
    }
  },

  toJSON: function() {
    var obj = {};
    obj.version = this.version;
    if(this.stat_tag) {
      obj.stat_tag = this.stat_tag;
    }
    obj.layers = [];
    var layers = this.visibleLayers();
    for(var i = 0; i < layers.length; ++i) {
      var layer = layers[i];
      obj.layers.push({
        type: 'cartodb',
        options: {
          sql: layer.options.sql,
          cartocss: layer.options.cartocss,
          cartocss_version: layer.options.cartocss_version || '2.1.0',
          interactivity: this._cleanInteractivity(layer.options.interactivity)
        }
      });
    }
    return obj;
  },

  removeLayer: function(layer) {
    if(layer < this.getLayerCount() && layer >= 0) {
      this.layers.splice(layer, 1);
      this.interactionEnabled.splice(layer, 1);
      this._reorderSubLayers();
      this.invalidate();
    }
    return this;
  },

  _reorderSubLayers: function() {
    for(var i = 0; i < this.layers.length; ++i) {
      var layer = this.layers[i];
      if(layer.sub) {
        layer.sub._setPosition(i);
      }
    }
  },

  addLayer: function(def, layer) {
    layer = layer === undefined ? this.getLayerCount(): layer;
    if(layer <= this.getLayerCount() && layer >= 0) {
      if(!def.sql || !def.cartocss) {
        throw new Error("layer definition should contain at least a sql and a cartocss");
        return this;
      }
      this.layers.splice(layer, 0, {
        type: 'cartodb',
        options: def
      });
      this._definitionUpdated();
    }
    return this;
  },

  /**
   * set interactivity attributes for a layer.
   * if attributes are passed as first param layer 0 is
   * set
   */
  setInteractivity: function(layer, attributes) {
    if(attributes === undefined) {
      attributes = layer;
      layer = 0;
    }

    if(layer >= this.getLayerCount() && layer < 0) {
      throw new Error("layer does not exist");
    }

    if(typeof(attributes) == 'string') {
      attributes = attributes.split(',');
    }

    for(var i = 0; i < attributes.length; ++i) {
      attributes[i] = attributes[i].replace(/ /g, '');
    }

    this.layers[layer].options.interactivity = attributes;
    this._definitionUpdated();
    return this;
  },

  setQuery: function(layer, sql) {
    if(sql === undefined) {
      sql = layer;
      layer = 0;
    }
    this.layers[layer].options.sql = sql
    this._definitionUpdated();
  },

  getQuery: function(layer) {
    layer = layer || 0;
    return this.layers[layer].options.sql
  },

  /**
   * Change style of the tiles
   * @params {style} New carto for the tiles
   */
  setCartoCSS: function(layer, style, version) {
    if(version === undefined) {
      version = style;
      style = layer;
      layer = 0;
    }

    version = version || cartodb.CARTOCSS_DEFAULT_VERSION;

    this.layers[layer].options.cartocss = style;
    this.layers[layer].options.cartocss_version = version;
    this._definitionUpdated();

  },

  /**
   * adds a new sublayer to the layer with the sql and cartocss params
   */
  createSubLayer: function(attrs, options) {
    this.addLayer(attrs);
    return this.getSubLayer(this.getLayerCount() - 1);
  },

  _getSqlApi: function(attrs) {
    attrs = attrs || {};
    var port = attrs.sql_api_port
    var domain = attrs.sql_api_domain + (port ? ':' + port: '')
    var protocol = attrs.sql_api_protocol;
    var version = 'v1';
    if (domain.indexOf('cartodb.com') !== -1) {
      //protocol = 'http';
      domain = "cartodb.com";
      version = 'v2';
    }

    var sql = new cartodb.SQL({
      user: attrs.user_name,
      protocol: protocol,
      host: domain,
      version: version
    });

    return sql;
  },

  fetchAttributes: function(layer_index, feature_id, columnNames, callback) {
    var layer = this.getLayer(layer_index);
    var sql = this._getSqlApi(this.options);

    // prepare columns with double quotes
    columnNames = _.map(columnNames, function(n) {
      return "\"" + n + "\"";
    }).join(',');

    var loadingTime = cartodb.core.Profiler.metric('cartodb-js.layergroup.attributes.time').start();
    // execute the sql
    sql.execute('select {{{ fields }}} from ({{{ sql }}}) as _cartodbjs_alias where cartodb_id = {{{ cartodb_id }}}', {
      fields: columnNames,
      cartodb_id: feature_id,
      sql: layer.options.sql
    }).done(function(interact_data) {
      loadingTime.end();
      if (interact_data.rows.length === 0 ) {
        callback(null);
        return;
      }
      callback(interact_data.rows[0]);
    }).error(function() {
      loadingTime.end();
      cartodb.core.Profiler.metric('cartodb-js.layergroup.attributes.error').inc();
      callback(null);
    });
  }


});


function SubLayer(_parent, position) {
  this._parent = _parent;
  this._position = position;
  this._added = true;
  this._bindInteraction();
  if (Backbone.Model) {
    this.infowindow = new Backbone.Model(this._parent.getLayer(this._position).infowindow);
    this.infowindow.bind('change', function() {
      var def = this._parent.getLayer(this._position);
      def.infowindow = this.infowindow.toJSON();
      this._parent.setLayer(this._position, def);
    }, this);
  }
}

SubLayer.prototype = {

  remove: function() {
    this._check();
    this._parent.removeLayer(this._position);
    this._unbindInteraction();
    this._added = false;
  },

  show: function() {
    if(this.get('hidden')) {
      this.set({
        hidden: false
      });
    }
  },

  hide: function() {
    if(!this.get('hidden')) {
      this.set({
        hidden: true
      });
    }
  },

  setSQL: function(sql) {
    return this.set({
      sql: sql
    });
  },

  setCartoCSS: function(cartocss) {
    return this.set({
      cartocss: cartocss
    });
  },

  setInteractivity: function(fields) {
    return this.set({
      interactivity: fields
    });
  },

  getSQL: function() {
    return this.get('sql');
  },

  getCartoCSS: function() {
    return this.get('cartocss');
  },

  setInteraction: function(active) {
    this._parent.setInteraction(this._position, active);
  },

  get: function(attr) {
    this._check();
    var attrs = this._parent.getLayer(this._position);
    return attrs.options[attr];
  },

  set: function(new_attrs) {
    this._check();
    var def = this._parent.getLayer(this._position);
    var attrs = def.options;
    for(var i in new_attrs) {
      attrs[i] = new_attrs[i];
    }
    this._parent.setLayer(this._position, def);
    return this;
  },

  unset: function(attr) {
    var def = this._parent.getLayer(this._position);
    delete def.options[attr];
    this._parent.setLayer(this._position, def);
  },

  _check: function() {
    if(!this._added) throw "sublayer was removed";
  },

  _unbindInteraction: function() {
    if(!this._parent.off) return;
    this._parent.off(null, null, this);
  },

  _bindInteraction: function() {
    if(!this._parent.on) return;
    var self = this;
    // binds a signal to a layer event and trigger on this sublayer
    // in case the position matches
    var _bindSignal = function(signal, signalAlias) {
      signalAlias = signalAlias || signal;
      self._parent.on(signal, function() {
        var args = Array.prototype.slice.call(arguments);
        if (parseInt(args[args.length - 1], 10) ==  self._position) {
          self.trigger.apply(self, [signalAlias].concat(args));
        }
      }, self);
    };
    _bindSignal('featureOver');
    _bindSignal('featureOut');
    _bindSignal('featureClick');
    _bindSignal('layermouseover', 'mouseover');
    _bindSignal('layermouseout', 'mouseout');
  },

  _setPosition: function(p) {
    this._position = p;
  }

};

// give events capabilitues
_.extend(SubLayer.prototype, Backbone.Events);
