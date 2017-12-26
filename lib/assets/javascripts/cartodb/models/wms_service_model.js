cdb.admin.WMSService = Backbone.Model.extend({

  _PROXY_URL:   '//cartodb-wms.global.ssl.fastly.net/api',
  _PROXY_TILES: '//cartodb-wms.global.ssl.fastly.net/mapproxy',

  methodToURL: {
    'read':   '/check',
    'create': '/add'
  },

  sync: function(method, model, options) {
    options = options || {};
    options.url = this.url(method.toLowerCase());
    options.dataType = 'jsonp';
    method = "READ";
    return Backbone.sync.apply(this, arguments);
  },

  url: function(method) {
    var req = this._PROXY_URL + this.methodToURL[method];
    var url = this.get('wms_url');

    var parser = document.createElement('a');

    parser.href = url;

    var params = parser.search.substr(1).split("&");

    var hasCapabilities = _.find(params, function(p) { return p.toLowerCase().indexOf("request=getcapabilities") !== -1; });
    var hasService      = _.find(params, function(p) { return p.toLowerCase().indexOf("service=wms") !== -1; });

    // If the user didn't provided the necessary params, let's add them

    if (!hasCapabilities) {
      params.push("request=GetCapabilities");
    }

    if (!hasService) {
      params.push("service=WMS");
    }

    url += "?" + params.join("&");
    req += '?url=' + encodeURIComponent(url);

    var isWMTS = this.get('type') === 'wmts';
    req += '&type=' + (isWMTS ? 'wmts' : 'wms');

    if (method === 'create') {
      if (this.get('layer') && this.get('srs')) {
        req += "&layer=" + this.get('layer');
        req += "&srs=EPSG:" + this.get('srs')[0].split(':')[1];
      } else if (isWMTS && this.get('layer') && this.get('matrix_sets').length > 0) {
        req += '&layer=' + this.get('layer');
        req += '&matrix_set=' + cdb.admin.WMSService.supportedMatrixSets(this.get('matrix_sets' || []))[0];
      }
    }

    return req;
  },

  newTileLayer: function() {
    if (!this.get('mapproxy_id')) {
      throw new Error('mapproxy_id must be set');
    }
    return new cdb.admin.TileLayer({
      urlTemplate: this._PROXY_TILES + '/' + this.get('mapproxy_id') + '/wmts/map/webmercator/{z}/{x}/{y}.png',
      attribution: this.get('attribution') || null,
      maxZoom: 21,
      minZoom: 0,
      name: this.get('title') || this.get('name'),
      proxy: true,
      bounding_boxes: this.get('bounding_boxes')
    });
  }
}, {

  SUPPORTED_MATRIX_SETS: [
    'EPSG:4326',
    'EPSG:4258'
  ],

  /**
   * Unfortunately the WMS proxy do not support all matrix sets for a WMTS kind of resource, so filter out the ones
   * that are actually supported for now.
   * @return {Array}
   */
  supportedMatrixSets: function(matrixSets) {
    // matrixSets = matrixSets || [];
    return _.intersection(matrixSets, this.SUPPORTED_MATRIX_SETS);
  }
});
