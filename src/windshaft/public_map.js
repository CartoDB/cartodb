

// maps_api_template

cdb.windshaft.PublicMap = function(attributes, options) {
  this.attributes = attributes;
  this.baseURL = options.baseURL;

  this.pngParams = ['map_key', 'api_key', 'cache_policy', 'updated_at'];
  this.gridParams = ['map_key', 'api_key', 'cache_policy', 'updated_at'];
}

cdb.windshaft.PublicMap.prototype.getMapId = function() {
  return this.attributes.layergroupid;
}

/**
 * Returns the index of a layer of a given type, as the tiler kwows it.
 *
 * @param {integer} index - number of layer of the specified type
 * @param {string} layerType - type of the layers
 */
cdb.windshaft.PublicMap.prototype.getLayerIndexByType = function(index, layerType) {
  var layers = this.attributes.metadata && this.attributes.metadata.layers;

  if (!layers) {
    return index;
  }

  var tilerLayerIndex = {}
  var j = 0;
  for (var i = 0; i < layers.length; i++) {
    if (layers[i].type == layerType) {
      tilerLayerIndex[j] = i;
      j++;
    }
  }
  if (tilerLayerIndex[index] == undefined) {
    return -1;
  }
  return tilerLayerIndex[index];
}

/**
 * Returns the index of a layer of a given type, as the tiler kwows it.
 *
 * @param {string|array} types - Type or types of layers
 */
cdb.windshaft.PublicMap.prototype.getLayerIndexesByType = function(types) {
  var layers = this.attributes.metadata && this.attributes.metadata.layers;

  if (!layers) {
    return;
  }
  var layerIndexes = [];
  for (var i = 0; i < layers.length; i++) {
    var layer = layers[i];
    var isValidType = layer.type !== 'torque';
    if (types && types.length > 0) {
      isValidType = isValidType && types.indexOf(layer.type) != -1
    }
    if (isValidType) {
      layerIndexes.push(i);
    }
  }
  return layerIndexes;
}

cdb.windshaft.PublicMap.prototype.getTiles = function() {
  // TODO: Use the CDN url
  // if (attributtes.cdn_url) {
  //   self.options.cdn_url = self.options.cdn_url || {}
  //   self.options.cdn_url = {
  //     http: map.cdn_url.http || self.options.cdn_url.http,
  //     https: map.cdn_url.https || self.options.cdn_url.https
  //   }
  // }

  var grids = [];
  var tiles = [];
  var params = [];
  var pngParams = this._encodeParams(params, this.pngParams);
  var gridParams = this._encodeParams(params, this.gridParams);
  var subdomains = ['0', '1', '2', '3'];

  // TODO: 
  // if(this.isHttps()) {
  //   subdomains = [null]; // no subdomain
  // }

  // TODO: Pass the filter that comes in the viz.json instead of "mapnik"
  var layerIndexes = this.getLayerIndexesByType("mapnik");
  if (layerIndexes.length) {
    var tileTemplate = '/' +  layerIndexes.join(',') +'/{z}/{x}/{y}';
    var gridTemplate = '/{z}/{x}/{y}';

    for(var i = 0; i < subdomains.length; ++i) {
      var s = subdomains[i];
      var cartodb_url = this._host(s) + MapBase.BASE_URL + '/' + this.getMapId();
      tiles.push(cartodb_url + tileTemplate + ".png" + (pngParams ? "?" + pngParams: '') );

      for(var layer = 0; layer < this.attributes.metadata.layers.length; ++layer) {
        var index = this.getLayerIndexByType(layer, "mapnik");
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
}

cdb.windshaft.PublicMap.prototype._encodeParams= function(params, included) {
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
}

cdb.windshaft.PublicMap.prototype._host = function(subhost) {
  // TODO: MAke this work with a CDN

  // var cdn_host = opts.cdn_url;
  // var has_empty_cdn = !cdn_host || (cdn_host && (!cdn_host.http && !cdn_host.https));

  // if (opts.no_cdn || has_empty_cdn) {
  //   return this._tilerHost();
  // } else {
  //   var protocol = this.isHttps() ? 'https': 'http';
  //   var h = protocol + "://";
  //   if (subhost) {
  //     h += subhost + ".";
  //   }

  //   var cdn_url = cdn_host[protocol];
  //   // build default template url if the cdn url is not templatized
  //   // this is for backwards compatiblity, ideally we should use the url
  //   // that tiler sends to us right away
  //   if (!this._isUserTemplateUrl(cdn_url)) {
  //     cdn_url = cdn_url  + "/{user}";
  //   }
  //   h += cdn_url.replace('{user}', opts.user_name)

  //   return h;
  // }
  return this.baseURL;
}