var _ = require('underscore');

var PROXY_URL = 'https://cartodb-wms.global.ssl.fastly.net/api';
var PROXY_TILES = 'https://cartodb-wms.global.ssl.fastly.net/mapproxy';
var METHOD_TO_URL = {
  'read': '/check',
  'create': '/add'
};
var SUPPORTED_MATRIX_SETS = [
  'EPSG:4326',
  'EPSG:4258'
];

function WMSService () {
  this._wms_url = null;
}

WMSService.prototype.generateURL = function (opts) {
  var req = PROXY_URL + METHOD_TO_URL[opts.method];
  var url = this._wms_url;

  var parser = document.createElement('a');

  parser.href = url;

  var params = parser.search.substr(1).split('&');

  var hasCapabilities = _.find(params, function (p) { return p.toLowerCase().indexOf('request=getcapabilities') !== -1; });
  var hasService = _.find(params, function (p) { return p.toLowerCase().indexOf('service=wms') !== -1; });

  // If the user didn't provided the necessary params, let's add them

  if (!hasCapabilities) {
    params.push('request=GetCapabilities');
  }

  if (!hasService) {
    params.push('service=WMS');
  }

  url = url.split('?')[0] + '?' + params.join('&');
  req += '?url=' + encodeURIComponent(url);

  var isWMTS = opts.type === 'wmts';
  req += '&type=' + (isWMTS ? 'wmts' : 'wms');

  if (opts.method === 'create') {
    if (opts.layer && opts.srs) {
      req += '&layer=' + opts.layer;
      req += '&srs=EPSG:' + opts.srs[0].split(':')[1];
    } else if (isWMTS && opts.layer && opts.matrix_sets.length > 0) {
      req += '&layer=' + opts.layer;
      req += '&matrix_set=' + this.supportedMatrixSets(opts.matrix_sets || [])[0];
    }
  }

  return req;
};

WMSService.prototype.getFetchLayersURL = function () {
  return this.generateURL({
    method: 'read'
  });
};

WMSService.prototype.saveLayerURL = function (opts) {
  var createOpts = _.extend({
    method: 'create'
  }, opts);

  return this.generateURL(createOpts);
};

WMSService.prototype.supportedMatrixSets = function (matrixSets) {
  return _.intersection(matrixSets, SUPPORTED_MATRIX_SETS);
};

WMSService.prototype.getProxyTilesURL = function () {
  return PROXY_TILES;
};

WMSService.prototype.setUrl = function (url) {
  this._wms_url = url;
};

module.exports = WMSService;
