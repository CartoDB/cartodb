

function LayerDefinition(layerDefinition, options) {

  this.options = _.defaults(options, {
    ajax: $.ajax,
    pngParams: ['api_key', 'cache_policy', 'updated_at'],
    gridParams: ['api_key', 'cache_policy', 'updated_at']
  });

  this.version = layerDefinition.version || '1.0.0';
  this.layers = _.clone(layerDefinition.layers);
  this.layerToken = null;
  this.silent = false;
}

LayerDefinition.prototype = {

  getLayerCount: function() {
    return this.layers.length;
  },

  toJSON: function() {
    var obj = {};
    obj.version = this.version;
    obj.layers = [];
    for(var i in this.layers) {
      var layer = this.layers[i];
      obj.layers.push({
        type: 'cartodb',
        options: {
          sql: layer.options.sql,
          cartocss: layer.options.cartocss,
          cartocss_version: layer.options.cartocss_version || '2.1.0',
          interactivity: layer.options.interactivity
        }
      });
    }
    return obj;
  },

  //TODO: support old browsers
  getLayerToken: function(callback) {
    var ajax = this.options.ajax;
    ajax({
      crossOrigin: true,
      type: 'POST',
      dataType: 'json',
      contentType: 'application/json',
      url: this._tilerHost() + '/tiles/layergroup',
      data: JSON.stringify(this.toJSON()),
      success: function(data) {
        callback(data);
      },
      error: function() {
        callback(null);
      }
    });
    return this;
  },

  removeLayer: function(layer) {
    if(layer < this.getLayerCount() && layer >= 0) {
      this.layers.splice(layer, 1);
      this._definitionUpdated();
    }
    return this;
  },

  getLayer: function(index) {
    return _.clone(this.layers[index]);
  },

  invalidate: function() {
    this.layerToken = null;
  },

  setLayer: function(layer, def) {
    if(layer < this.getLayerCount() && layer >= 0) {
      this.layers[layer] = _.clone(def);
    }
    return this;
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

  getTiles: function(callback) {
    var self = this;
    if(self.layerToken) {
      callback && callback(self._layerGroupTiles(self.layerToken));
      return this;
    }
    this.getLayerToken(function(data) {
      if(data) {
        self.layertoken = data.layergroupid;
        callback && callback(self._layerGroupTiles(data.layergroupid));
      } else {
        callback && callback(null);
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
      var cartodb_url = this._host(s) + '/tiles/layergroup/' + layerGroupId 
      tiles.push(cartodb_url + tileTemplate + ".png?" + pngParams );

      var gridParams = this._encodeParams(params, this.options.gridParams);
      for(var layer in this.layers) {
        grids[layer] = grids[layer] || [];
        grids[layer].push(cartodb_url + "/layer" + layer +  tileTemplate + ".grid.json?" + gridParams);
      }
    }

    return {
      tiles: tiles,
      grids: grids
    }

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

  onLayerDefinitionUpdated: function() {},

  setSilent: function(b) {
    this.silent = b;
  },

  _definitionUpdated: function() {
    if(this.silent) return;
    this.invalidate();
    this.onLayerDefinitionUpdated();
  },

  /**
   * get tile json for layer
   */
  getTileJSON: function(layer, callback) {
    layer = layer == undefined ? 0: layer;
    this.getTiles(function(urls) {
      if(!urls) {
        callback(null);
        return;
      }
      if(callback) {
        callback({
          tilejson: '2.0.0',
          scheme: 'xyz',
          grids: urls.grids[layer],
          tiles: urls.tiles,
          formatter: function(options, data) { return data; }
        });
      }
    });
  },

  /**
   * Change query of the tiles
   * @params {str} New sql for the tiles
   */
  setQuery: function(layer, sql) {
    if(sql === undefined) {
      sql = layer;
      layer = 0;
    }
    this.layers[layer].options.sql = sql
    this._definitionUpdated();
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

    version = version || cdb.CARTOCSS_DEFAULT_VERSION;

    this.layers[layer].options.cartocss = style;
    this.layers[layer].options.cartocss_version = version;
    this._definitionUpdated();

  },

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
      h += cdb.CDB_HOST[opts.tiler_protocol] + "/" + opts.user_name;
      return h;
    }
  }

};
