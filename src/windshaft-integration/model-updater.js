var _ = require('underscore');
var log = require('../cdb.log');
var util = require('../core/util.js');
var RuleToLegendModelAdapters = require('./legends/rule-to-legend-model-adapters');

function getSubdomain (subdomains, resource) {
  var index = util.crc32(resource) % subdomains.length;
  return subdomains[index];
}

/**
 * This class exposes a method that knows how to set/update the metadata on internal
 * CartoDB.js models that are linked to a "resource" in the Maps API.
 */
var ModelUpdater = function (deps) {
  if (!deps.visModel) throw new Error('visModel is required');
  if (!deps.mapModel) throw new Error('mapModel is required');
  if (!deps.layerGroupModel) throw new Error('layerGroupModel is required');
  if (!deps.layersCollection) throw new Error('layersCollection is required');
  if (!deps.dataviewsCollection) throw new Error('dataviewsCollection is required');
  if (!deps.analysisCollection) throw new Error('analysisCollection is required');

  this._visModel = deps.visModel;
  this._mapModel = deps.mapModel;
  this._layerGroupModel = deps.layerGroupModel;
  this._layersCollection = deps.layersCollection;
  this._dataviewsCollection = deps.dataviewsCollection;
  this._analysisCollection = deps.analysisCollection;
};

ModelUpdater.prototype.updateModels = function (windshaftMap, sourceId, forceFetch) {
  this._updateVisModel(windshaftMap);
  this._updateLayerModels(windshaftMap);
  this._updateLayerGroupModel(windshaftMap);
  this._updateDataviewModels(windshaftMap, sourceId, forceFetch);
  this._updateAnalysisModels(windshaftMap);
};

ModelUpdater.prototype._updateVisModel = function (windshaftMap) {
  this._visModel.setOk();
};

ModelUpdater.prototype._updateLayerGroupModel = function (windshaftMap) {
  var urls = {
    tiles: this._generateTileURLTemplate(windshaftMap),
    subdomains: windshaftMap.getSupportedSubdomains(),
    grids: this._calculateGridURLTemplatesForCartoDBLayers(windshaftMap),
    attributes: this._calculateAttributesBaseURLsForCartoDBLayers(windshaftMap),
    image: this._calculateStaticMapURL(windshaftMap)
  };

  this._layerGroupModel.set({
    indexOfLayersInWindshaft: windshaftMap.getLayerIndexesByType('mapnik'),
    urls: urls
  });
};

ModelUpdater.prototype._calculateStaticMapURL = function (windshaftMap) {
  return [
    windshaftMap.getStaticBaseURL(),
    '{z}/{lat}/{lng}/{width}/{height}.{format}'
  ].join('/');
};

ModelUpdater.prototype._generateTileURLTemplate = function (windshaftMap) {
  return windshaftMap.getBaseURL() + '/{layerIndexes}/{z}/{x}/{y}.{format}';
};

ModelUpdater.prototype._calculateGridURLTemplatesForCartoDBLayers = function (windshaftMap) {
  var urlTemplates = [];
  var indexesOfMapnikLayers = windshaftMap.getLayerIndexesByType('mapnik');
  if (indexesOfMapnikLayers.length > 0) {
    _.each(indexesOfMapnikLayers, function (index) {
      var layerUrlTemplates = [];
      var gridURLTemplate = this._generateGridURLTemplate(windshaftMap, index);
      var subdomains = windshaftMap.getSupportedSubdomains();
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

ModelUpdater.prototype._generateGridURLTemplate = function (windshaftMap, index) {
  return windshaftMap.getBaseURL() + '/' + index + '/{z}/{x}/{y}.grid.json';
};

ModelUpdater.prototype._calculateAttributesBaseURLsForCartoDBLayers = function (windshaftMap) {
  var urls = [];
  var indexesOfMapnikLayers = windshaftMap.getLayerIndexesByType('mapnik');
  if (indexesOfMapnikLayers.length > 0) {
    _.each(indexesOfMapnikLayers, function (index) {
      urls.push(this._generateAttributesBaseURL(windshaftMap, index));
    }, this);
  }
  return urls;
};

ModelUpdater.prototype._generateAttributesBaseURL = function (windshaftMap, index) {
  var baseURL = windshaftMap.getBaseURL() + '/' + index + '/attributes';
  if (baseURL.indexOf('{s}') >= 0) {
    var subdomain = getSubdomain(windshaftMap.getSupportedSubdomains(), baseURL);
    baseURL = baseURL.replace('{s}', subdomain);
  }
  return baseURL;
};

ModelUpdater.prototype._updateLayerModels = function (windshaftMap) {
  // CartoDB / mapnik layers
  var indexesOfMapnikLayers = windshaftMap.getLayerIndexesByType('mapnik');
  _.each(this._layersCollection.getCartoDBLayers(), function (layerModel, localLayerIndex) {
    var windshaftMapLayerIndex = indexesOfMapnikLayers[localLayerIndex];
    layerModel.set('meta', windshaftMap.getLayerMetadata(windshaftMapLayerIndex));
    this._updateLegendModels(layerModel, windshaftMapLayerIndex, windshaftMap);

    layerModel.setOk();
  }, this);

  // Torque / torque layers
  var indexesOfTorqueLayers = windshaftMap.getLayerIndexesByType('torque');
  _.each(this._layersCollection.getTorqueLayers(), function (layerModel, localLayerIndex) {
    var windshaftMapLayerIndex = indexesOfTorqueLayers[localLayerIndex];
    var meta = windshaftMap.getLayerMetadata(windshaftMapLayerIndex);
    layerModel.set('meta', meta);
    // deep-insight.js expects meta attributes as attributes for some reason
    layerModel.set(meta);
    layerModel.set('subdomains', windshaftMap.getSupportedSubdomains());
    layerModel.set('tileURLTemplates', this._calculateTileURLTemplatesForTorqueLayers(windshaftMap));
    this._updateLegendModels(layerModel, windshaftMapLayerIndex, windshaftMap);

    layerModel.setOk();
  }, this);
};

ModelUpdater.prototype._calculateTileURLTemplatesForTorqueLayers = function (windshaftMap) {
  var urlTemplates = [];
  var indexesOfTorqueLayers = windshaftMap.getLayerIndexesByType('torque');
  if (indexesOfTorqueLayers.length > 0) {
    urlTemplates.push(this._generateTorqueTileURLTemplate(windshaftMap, indexesOfTorqueLayers));
  }
  return urlTemplates;
};

ModelUpdater.prototype._generateTorqueTileURLTemplate = function (windshaftMap, layerIndexes) {
  return windshaftMap.getBaseURL() + '/' + layerIndexes.join(',') + '/{z}/{x}/{y}.json.torque';
};

ModelUpdater.prototype._updateLegendModels = function (layerModel, remoteLayerIndex, windshaftMap) {
  var layerMetadata = windshaftMap.getLayerMetadata(remoteLayerIndex);
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

ModelUpdater.prototype._updateDataviewModels = function (windshaftMap, sourceId, forceFetch) {
  this._dataviewsCollection.each(function (dataviewModel) {
    var dataviewMetadata = windshaftMap.getDataviewMetadata(dataviewModel.get('id'));
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

ModelUpdater.prototype._updateAnalysisModels = function (windshaftMap) {
  this._analysisCollection.each(function (analysisNode) {
    var analysisMetadata = windshaftMap.getAnalysisNodeMetadata(analysisNode.get('id'));
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
    var analysisModel = this._analysisCollection.get(error.analysisId);
    analysisModel && analysisModel.setError(error);
  } else {
    this._visModel.setError(error);
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
module.exports = ModelUpdater;
