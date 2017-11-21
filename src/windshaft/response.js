var _ = require('underscore');
var WindshaftConfig = require('./config');

/**
 * Wrapper over a server response to a map instantiation giving some utility methods.
 * @constructor
 * @param {object} windshaftSettings - Object containing the request options.
 * @param {string} serverResponse - The json string representing a windshaft response to a map instantiation.
 */
function Response (windshaftSettings, serverResponse) {
  this._windshaftSettings = windshaftSettings;
  this._layerGroupId = serverResponse.layergroupid;
  this._layers = serverResponse.metadata.layers;
  this._dataviews = serverResponse.metadata.dataviews;
  this._analyses = serverResponse.metadata.analyses;
  this._cdnUrl = serverResponse.cdn_url;
}

/**
 * Return the indexes of the layers for a certain type.
 * @example
 * // layers = [ carto, carto, tiled, plain, tiled, torque];
 * getLayerIndexesByType('mapnik') // [0, 1]
 * getLayerIndexesByType('tiled') // [2, 4]
 * getLayerIndexesByType('torque') // [5]
 * @param {string} Type - The type of the layers: mapnik, torque, plain, tiled.
 */
Response.prototype.getLayerIndexesByType = function getLayerIndexesByType (layerType) {
  return _.reduce(this._getLayers(), function (layerIndexes, layer, index) {
    if (layer.type === layerType) {
      layerIndexes.push(index);
    }
    return layerIndexes;
  }, []);
};

/**
 * Build the base url to build windshaft map requests.
 */
Response.prototype.getBaseURL = function getBaseURL () {
  return [
    this._getHost(),
    WindshaftConfig.MAPS_API_BASE_URL,
    this._layerGroupId
  ].join('/');
};

/**
 * Build the base url for static maps.
 */
Response.prototype.getStaticBaseURL = function getStaticBaseURL () {
  return [
    this._getHost(),
    WindshaftConfig.MAPS_API_BASE_URL,
    'static/center',
    this._layerGroupId
  ].join('/');
};

Response.prototype._getHost = function _getHost () {
  var urlTemplate = this._windshaftSettings.urlTemplate;
  var userName = this._windshaftSettings.userName;
  var protocol = this.getProtocol();
  var cdnUrl = this._cdnUrl;
  var cdnHost = cdnUrl && cdnUrl[protocol];
  var templates = cdnUrl && cdnUrl.templates;

  if (templates && templates[protocol]) {
    var template = templates[protocol];
    return template.url + '/' + userName;
  }

  if (cdnHost) {
    return [protocol, '://', cdnHost, '/', userName].join('');
  }

  return urlTemplate.replace('{user}', userName);
};

Response.prototype.getProtocol = function getProtocol () {
  return this._isHttps() ? 'https' : 'http';
};

Response.prototype._isHttps = function isHttps () {
  return this._windshaftSettings.urlTemplate.indexOf('https') === 0;
};

Response.prototype.getSupportedSubdomains = function getSupportedSubdomains () {
  var templates = this._cdnUrl && this._cdnUrl.templates;
  var protocol = this.getProtocol();
  if (templates && templates[protocol]) {
    return templates[protocol].subdomains;
  }
  return [];
};

Response.prototype.getLayerMetadata = function getLayerMetadata (layerIndex) {
  var layerMeta = {};
  var layers = this._getLayers();
  if (layers && layers[layerIndex]) {
    layerMeta = layers[layerIndex].meta || {};
  }
  return layerMeta;
};

Response.prototype.getDataviewMetadata = function getDataviewMetadata (dataviewId) {
  var dataviews = this._getDataviews();
  if (dataviews && dataviews[dataviewId]) {
    return dataviews[dataviewId];
  }

  // Try to get dataview's metatadta from the 'widgets' dictionary inside the metadata of each of the layers
  dataviews = {};
  var layersDataviews = _.compact(_.map(this._getLayers(), function (layer) { return layer.widgets; }));
  _.each(layersDataviews, function (layerDataviews) { _.extend(dataviews, layerDataviews); });

  if (dataviews && dataviews[dataviewId]) {
    return dataviews[dataviewId];
  }
};

Response.prototype.getAnalysisNodeMetadata = function (analysisId) {
  var metadata = {};
  var nodes = _.map(this._getAnalyses(), function (analysis) {
    return analysis.nodes;
  });
  _.each(nodes, function (node) { _.extend(metadata, node); });

  return metadata[analysisId];
};

/**
 * Return the array with all the layers in the response
 */
Response.prototype._getLayers = function _getLayers () {
  return this._layers;
};

Response.prototype._getDataviews = function _getDataviews () {
  return this._dataviews;
};

Response.prototype._getAnalyses = function _getAnalyses () {
  return this._analyses;
};

module.exports = Response;
