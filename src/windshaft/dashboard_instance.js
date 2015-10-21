cdb.windshaft.DashboardInstance = cdb.core.Model.extend({
 
  initialize: function() {
    this.ajax = $.ajax;

    // TODO: What params are really used?
    this.pngParams = ['map_key', 'api_key', 'cache_policy', 'updated_at'];
    this.gridParams = ['map_key', 'api_key', 'cache_policy', 'updated_at'];
  },

  getMapId: function() {
    return this.get('layergroupid');
  },

  getBaseURL: function() {
    return [
      this.getHost(),
      cdb.windshaft.config.MAPS_API_BASE_URL,
      this.getMapId(),
    ].join('/');
  },

  getHost: function(subhost) {
    var userName = this.get('userName');
    var protocol = this._useHTTPS() ? 'https' : 'http';
    var subhost = subhost || '';
    var host = this.get('windshaftURLTemplate').replace('{user}', userName);
    var cdnHost = this.get('cdn_url') && this.get('cdn_url')[protocol];
    if (cdnHost) {
      host = [protocol, '://', subhost, cdnHost, '/', userName].join('');
    }
    
    return host;
  },

  _useHTTPS: function() {
    return this.get('windshaftURLTemplate').indexOf('https') === 0;
  },

  /**
   * Returns the index of a layer of a given type, as the tiler kwows it.
   *
   * @param {integer} index - number of layer of the specified type
   * @param {string} layerType - type of the layers
   */
  getLayerIndexByType: function(index, layerType) {
    var layers = this.get('metadata') && this.get('metadata').layers;

    if (!layers) {
      return index;
    }

    var tilerLayerIndex = {};
    var j = 0;
    for (var i = 0; i < layers.length; i++) {
      if (layers[i].type == layerType) {
        tilerLayerIndex[j] = i;
        j++;
      }
    }
    if (tilerLayerIndex[index] === undefined) {
      return -1;
    }
    return tilerLayerIndex[index];
  },

  /**
   * Returns the index of a layer of a given type, as the tiler kwows it.
   *
   * @param {string|array} types - Type or types of layers
   */
  getLayerIndexesByType: function(types) {
    var layers = this.get('metadata') && this.get('metadata').layers;

    if (!layers) {
      return;
    }
    var layerIndexes = [];
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var isValidType = layer.type !== 'torque';
      if (types && types.length > 0) {
        isValidType = isValidType && types.indexOf(layer.type) != -1;
      }
      if (isValidType) {
        layerIndexes.push(i);
      }
    }
    return layerIndexes;
  },

  getTiles: function() {
    var grids = [];
    var tiles = [];
    var params = [];
    var pngParams = this._encodeParams(params, this.pngParams);
    var gridParams = this._encodeParams(params, this.gridParams);
    var subdomains = ['0', '1', '2', '3'];

    if(this._useHTTPS()) {
      subdomains = [''];
    }

    var layerIndexes = this.getLayerIndexesByType("mapnik");
    if (layerIndexes.length) {
      var tileTemplate = '/' +  layerIndexes.join(',') +'/{z}/{x}/{y}';
      var gridTemplate = '/{z}/{x}/{y}';

      for(var i = 0; i < subdomains.length; ++i) {
        var s = subdomains[i];
        var cartodb_url = this.getHost(s) + MapBase.BASE_URL + '/' + this.getMapId();
        tiles.push(cartodb_url + tileTemplate + ".png" + (pngParams ? "?" + pngParams: '') );

        for(var layer = 0; layer < this.get('metadata').layers.length; ++layer) {
          var index = this.getLayerIndexByType(layer, "mapnik");
          grids[layer] = grids[layer] || [];
          grids[layer].push(cartodb_url + "/" + index +  gridTemplate + ".grid.json" + (gridParams ? "?" + gridParams: ''));
        }
      }
    } else {
      tiles = [MapBase.EMPTY_GIF];
    }

    this.urls = {
      tiles: tiles,
      grids: grids
    };
    return this.urls;
  },

  _encodeParams: function(params, included) {
    if(!params) return '';
    var url_params = [];
    included = included || _.keys(params);
    for(var i in included) {
      var k = included[i];
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
    return url_params.join('&');
  }
})
