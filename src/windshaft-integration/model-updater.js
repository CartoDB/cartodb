var _ = require('underscore');
var log = require('../cdb.log');
var util = require('../core/util.js');
var RuleToLegendModelAdapters = require('./legends/rule-to-legend-model-adapters');
var AnalysisService = require('../analysis/analysis-service');
var Backbone = require('backbone');

function getSubdomain (subdomains, resource) {
  var index = util.crc32(resource) % subdomains.length;
  return subdomains[index];
}

/**
 * This class exposes a method that knows how to set/update the metadata on internal
 * CartoDB.js models that are linked to a "resource" in the Maps API.
 */
var ModelUpdater = function (deps) {
  if (!deps.layerGroupModel) throw new Error('layerGroupModel is required');
  if (!deps.layersCollection) throw new Error('layersCollection is required');
  if (!deps.dataviewsCollection) throw new Error('dataviewsCollection is required');

  this._layerGroupModel = deps.layerGroupModel;
  this._layersCollection = deps.layersCollection;
  this._dataviewsCollection = deps.dataviewsCollection;
};

ModelUpdater.prototype.updateModels = function (responseWrapper, sourceId, forceFetch) {
  this._updateLayerModels(responseWrapper);
  this._updateLayerGroupModel(responseWrapper);
  this._updateDataviewModels(responseWrapper, sourceId, forceFetch);
  this._updateAnalysisModels(responseWrapper);
};

ModelUpdater.prototype._updateLayerGroupModel = function (responseWrapper) {
  var urls = {
    tiles: this._generateTileURLTemplate(responseWrapper),
    subdomains: responseWrapper.getSupportedSubdomains(),
    grids: this._calculateGridURLTemplatesForCartoDBLayers(responseWrapper),
    attributes: this._calculateAttributesBaseURLsForCartoDBLayers(responseWrapper),
    image: this._calculateStaticMapURL(responseWrapper)
  };

  this._layerGroupModel.set({
    indexOfLayersInWindshaft: responseWrapper.getLayerIndexesByType('mapnik'),
    urls: urls
  });
};

ModelUpdater.prototype._calculateStaticMapURL = function (responseWrapper) {
  return [
    responseWrapper.getStaticBaseURL(),
    '{z}/{lat}/{lng}/{width}/{height}.{format}'
  ].join('/');
};

ModelUpdater.prototype._generateTileURLTemplate = function (responseWrapper) {
  return responseWrapper.getBaseURL() + '/{layerIndexes}/{z}/{x}/{y}.{format}';
};

ModelUpdater.prototype._calculateGridURLTemplatesForCartoDBLayers = function (responseWrapper) {
  var urlTemplates = [];
  var indexesOfMapnikLayers = responseWrapper.getLayerIndexesByType('mapnik');
  if (indexesOfMapnikLayers.length > 0) {
    _.each(indexesOfMapnikLayers, function (index) {
      var layerUrlTemplates = [];
      var gridURLTemplate = this._generateGridURLTemplate(responseWrapper, index);
      var subdomains = responseWrapper.getSupportedSubdomains();
      if (subdomains.length) {
        _.each(subdomains, function (subdomain) {
          layerUrlTemplates.push(gridURLTemplate.replace('{s}', subdomain));
        });
      } else {
        layerUrlTemplates.push(gridURLTemplate);
      }

      urlTemplates.push(layerUrlTemplates);
    }, this);
  }
  return urlTemplates;
};

ModelUpdater.prototype._generateGridURLTemplate = function (responseWrapper, index) {
  return responseWrapper.getBaseURL() + '/' + index + '/{z}/{x}/{y}.grid.json';
};

ModelUpdater.prototype._calculateAttributesBaseURLsForCartoDBLayers = function (responseWrapper) {
  var urls = [];
  var indexesOfMapnikLayers = responseWrapper.getLayerIndexesByType('mapnik');
  if (indexesOfMapnikLayers.length > 0) {
    _.each(indexesOfMapnikLayers, function (index) {
      urls.push(this._generateAttributesBaseURL(responseWrapper, index));
    }, this);
  }
  return urls;
};

ModelUpdater.prototype._generateAttributesBaseURL = function (responseWrapper, index) {
  var baseURL = responseWrapper.getBaseURL() + '/' + index + '/attributes';
  if (baseURL.indexOf('{s}') >= 0) {
    var subdomain = getSubdomain(responseWrapper.getSupportedSubdomains(), baseURL);
    baseURL = baseURL.replace('{s}', subdomain);
  }
  return baseURL;
};

ModelUpdater.prototype._updateLayerModels = function (responseWrapper) {
  // CartoDB / mapnik layers
  var indexesOfMapnikLayers = responseWrapper.getLayerIndexesByType('mapnik');
  _.each(this._layersCollection.getCartoDBLayers(), function (layerModel, localLayerIndex) {
    var responseWrapperLayerIndex = indexesOfMapnikLayers[localLayerIndex];
    layerModel.set('meta', responseWrapper.getLayerMetadata(responseWrapperLayerIndex));
    this._updateLegendModels(layerModel, responseWrapperLayerIndex, responseWrapper);

    layerModel.setOk();
  }, this);

  // Torque / torque layers
  var indexesOfTorqueLayers = responseWrapper.getLayerIndexesByType('torque');
  _.each(this._layersCollection.getTorqueLayers(), function (layerModel, localLayerIndex) {
    var responseWrapperLayerIndex = indexesOfTorqueLayers[localLayerIndex];
    var meta = responseWrapper.getLayerMetadata(responseWrapperLayerIndex);
    layerModel.set('meta', meta);
    // deep-insight.js expects meta attributes as attributes for some reason
    layerModel.set(meta);
    layerModel.set('subdomains', responseWrapper.getSupportedSubdomains());
    layerModel.set('tileURLTemplates', this._calculateTileURLTemplatesForTorqueLayers(responseWrapper));
    this._updateLegendModels(layerModel, responseWrapperLayerIndex, responseWrapper);

    layerModel.setOk();
  }, this);
};

ModelUpdater.prototype._calculateTileURLTemplatesForTorqueLayers = function (responseWrapper) {
  var urlTemplates = [];
  var indexesOfTorqueLayers = responseWrapper.getLayerIndexesByType('torque');
  if (indexesOfTorqueLayers.length > 0) {
    urlTemplates.push(this._generateTorqueTileURLTemplate(responseWrapper, indexesOfTorqueLayers));
  }
  return urlTemplates;
};

ModelUpdater.prototype._generateTorqueTileURLTemplate = function (responseWrapper, layerIndexes) {
  return responseWrapper.getBaseURL() + '/' + layerIndexes.join(',') + '/{z}/{x}/{y}.json.torque';
};

ModelUpdater.prototype._updateLegendModels = function (layerModel, remoteLayerIndex, responseWrapper) {
  var layerMetadata = responseWrapper.getLayerMetadata(remoteLayerIndex);
  _.each(this._getLayerLegends(layerModel), function (legendModel) {
    this._updateLegendModel(legendModel, layerMetadata);
  }, this);
};

ModelUpdater.prototype._updateLegendModel = function (legendModel, layerMetadata) {
  var cartoCSSRules = layerMetadata && layerMetadata.cartocss_meta && layerMetadata.cartocss_meta.rules;
  try {
    var newLegendAttrs = {
      state: 'success'
    };
    if (cartoCSSRules) {
      var adapter = RuleToLegendModelAdapters.getAdapterForLegend(legendModel);
      var rulesForLegend = _.filter(cartoCSSRules, adapter.canAdapt);
      if (!_.isEmpty(rulesForLegend)) {
        newLegendAttrs = _.extend(newLegendAttrs, adapter.adapt(rulesForLegend));
      }
    }
    legendModel.set(newLegendAttrs);
  } catch (error) {
    legendModel.set({ state: 'error' });
    log.error("legend of type '" + legendModel.get('type') + "' couldn't be updated: " + error.message);
  }
};

ModelUpdater.prototype._updateDataviewModels = function (responseWrapper, sourceId, forceFetch) {
  this._dataviewsCollection.each(function (dataviewModel) {
    var dataviewMetadata = responseWrapper.getDataviewMetadata(dataviewModel.get('id'));
    if (dataviewMetadata) {
      dataviewModel.set({
        url: dataviewMetadata.url[this._getProtocol()]
      }, {
        sourceId: sourceId,
        forceFetch: forceFetch
      });
    }
  }, this);
};

ModelUpdater.prototype._updateAnalysisModels = function (responseWrapper) {
  var analysisNodesCollection = this._getUniqueAnalysisNodesCollection();
  analysisNodesCollection.each(function (analysisNode) {
    var analysisMetadata = responseWrapper.getAnalysisNodeMetadata(analysisNode.get('id'));
    var attrs;
    if (analysisMetadata) {
      attrs = {
        status: analysisMetadata.status,
        url: analysisMetadata.url[this._getProtocol()],
        query: analysisMetadata.query
      };

      attrs = _.omit(attrs, analysisNode.getParamNames());

      if (analysisMetadata.error_message) {
        attrs = _.extend(attrs, {
          error: {
            message: analysisMetadata.error_message
          }
        });
        analysisNode.set(attrs);
      } else {
        analysisNode.set(attrs);
        analysisNode.setOk();
      }
    }
  }, this);
};

ModelUpdater.prototype._getProtocol = function () {
  // When running tests window.locationn.protocol using the jasmine test runner,
  // window.location.protocol returns 'file:'. This is a little hack to make tests happy.
  if (window.location.protocol === 'file:') {
    return 'http';
  }
  return window.location.protocol.replace(':', '');
};

ModelUpdater.prototype.setErrors = function (errors) {
  _.each(errors, this._setError, this);
  this._setLegendErrors();
};

ModelUpdater.prototype._setError = function (error) {
  if (error.isLayerError()) {
    var layerModel = this._layersCollection.get(error.layerId);
    layerModel && layerModel.setError(error);
  } else if (error.isAnalysisError()) {
    var analysisNodesCollection = this._getUniqueAnalysisNodesCollection();
    var analysisModel = analysisNodesCollection.get(error.analysisId);
    analysisModel && analysisModel.setError(error);
  }
};

ModelUpdater.prototype._setLegendErrors = function () {
  var legendModels = this._layersCollection.chain()
    .map(this._getLayerLegends)
    .compact()
    .flatten()
    .value();

  _.each(legendModels, function (legendModel) {
    legendModel.set('state', 'error');
  });
};

ModelUpdater.prototype._getLayerLegends = function (layerModel) {
  return layerModel.legends && [
    layerModel.legends.bubble,
    layerModel.legends.category,
    layerModel.legends.choropleth
  ];
};

ModelUpdater.prototype._getUniqueAnalysisNodesCollection = function () {
  var analysisNodes = AnalysisService.getUniqueAnalysisNodes(this._layersCollection, this._dataviewsCollection);
  return new Backbone.Collection(analysisNodes);
};

module.exports = ModelUpdater;
