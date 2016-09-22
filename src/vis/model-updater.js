var _ = require('underscore');

// TODO: Could be renamed to windshaft-integrations.js
/**
 * This class exposes a method that knows how to set/update the metadata on internal
 * CartoDB.js models that are linked to a "resource" in the Maps API.
 */
var ModelUpdater = function (deps) {
  if (!deps.visModel) {
    throw new Error('visModel is required');
  }
  if (!deps.layerGroupModel) {
    throw new Error('layerGroupModel is required');
  }
  if (!deps.layersCollection) {
    throw new Error('layersCollection is required');
  }
  if (!deps.dataviewsCollection) {
    throw new Error('dataviewsCollection is required');
  }
  if (!deps.analysisCollection) {
    throw new Error('analysisCollection is required');
  }

  this._visModel = deps.visModel;
  this._layerGroupModel = deps.layerGroupModel;
  this._layersCollection = deps.layersCollection;
  this._dataviewsCollection = deps.dataviewsCollection;
  this._analysisCollection = deps.analysisCollection;
};

ModelUpdater.prototype.updateModels = function (windshaftMap, sourceId, forceFetch) {
  this._updateLayerGroupModel(windshaftMap);
  this._updateLayerModels(windshaftMap);
  this._updateDataviewModels(windshaftMap, sourceId, forceFetch);
  this._updateAnalysisModels(windshaftMap);

  this._visModel.setOk();
};

ModelUpdater.prototype._updateLayerGroupModel = function (windshaftMap) {
  var urls = {
    tiles: this._calculateTileURLTemplatesForCartoDBLayers(windshaftMap),
    grids: this._calculateGridURLTemplatesForCartoDBLayers(windshaftMap),
    attributes: this._calculateAttributesBaseURLsForCartoDBLayers(windshaftMap)
  };

  this._layerGroupModel.set({
    indexOfLayersInWindshaft: windshaftMap.getLayerIndexesByType('mapnik'),
    urls: urls
  });
};

// TODO: Move to windshaftMap? (would need to know which layers are visible)
ModelUpdater.prototype._calculateTileURLTemplatesForCartoDBLayers = function (windshaftMap) {
  var urlTemplates = [];
  _.each(windshaftMap.getSupportedSubdomains(), function (subdomain) {
    urlTemplates.push(this._generatePNGTileURLTemplate(windshaftMap, subdomain));
  }, this);

  return urlTemplates;
};

ModelUpdater.prototype._generatePNGTileURLTemplate = function (windshaftMap, subdomain) {
  return windshaftMap.getBaseURL(subdomain) + '/{layerIndexes}/{z}/{x}/{y}.png';
};

// TODO: Move to windshaftMap?
ModelUpdater.prototype._calculateGridURLTemplatesForCartoDBLayers = function (windshaftMap) {
  var urlTemplates = [];
  // TODO: windshaftMap.getLayerIndexesByType('mapnik') -> give it a name
  var indexesOfMapnikLayers = windshaftMap.getLayerIndexesByType('mapnik');
  if (indexesOfMapnikLayers.length > 0) {
    _.each(indexesOfMapnikLayers, function (index) {
      var layerUrlTemplates = [];
      _.each(windshaftMap.getSupportedSubdomains(), function (subdomain) {
        layerUrlTemplates.push(this._generateGridURLTemplate(windshaftMap, subdomain, index));
      }, this);
      urlTemplates.push(layerUrlTemplates);
    }, this);
  }
  return urlTemplates;
};

ModelUpdater.prototype._generateGridURLTemplate = function (windshaftMap, subdomain, index) {
  return windshaftMap.getBaseURL(subdomain) + '/' + index + '/{z}/{x}/{y}.grid.json';
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
  return windshaftMap.getBaseURL() + '/' + index + '/attributes';
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
    layerModel.set('meta', windshaftMap.getLayerMetadata(windshaftMapLayerIndex));
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

var isRuleForChoroplethLegend = function (rule) {
  return ['line-color', 'marker-fill', 'polygon-fill'].indexOf(rule.prop) >= 0;
};

var isRuleForCategoryLegend = function (rule) {
  return rule.mapping === '=';
};

var isRuleForBubbleLegend = function (rule) {
  return rule.prop === 'marker-width';
};

ModelUpdater.prototype._updateLegendModels = function (layerModel, remoteLayerIndex, windshaftMap) {
  var layerMetadata = windshaftMap.getLayerMetadata(remoteLayerIndex);
  if (layerMetadata && layerMetadata.cartocss_meta && layerMetadata.cartocss_meta.rules) {
    var ruleForChoroplethLegend = _.find(layerMetadata.cartocss_meta.rules, isRuleForChoroplethLegend);
    if (ruleForChoroplethLegend) {
      var choroplethLegendModel = layerModel.legends.choropleth;
      this._updateChoroplethLegendModel(choroplethLegendModel, ruleForChoroplethLegend);
    }

    var ruleForCategoriesLegend = _.find(layerMetadata.cartocss_meta.rules, isRuleForCategoryLegend);
    if (ruleForCategoriesLegend) {
      var categoryLegendModel = layerModel.legends.category;
      this._updateCategoryLegendModel(categoryLegendModel, ruleForCategoriesLegend);
    }

    var ruleForBubbleLegend = _.find(layerMetadata.cartocss_meta.rules, isRuleForBubbleLegend);
    if (ruleForBubbleLegend) {
      var bubbleLegendModel = layerModel.legends.bubble;
      this._updateBubbleLegendModel(bubbleLegendModel, ruleForBubbleLegend);
    }
  }
};

ModelUpdater.prototype._updateChoroplethLegendModel = function (legendModel, rule) {
  var values = rule.values;
  var colors = _.map(values, function (value, i) {
    var label = '';
    if (i === 0) {
      label = rule.stats.min_val;
    } else if (i === values.length - 1) {
      label = rule.stats.max_val;
    }
    return { value: value, label: label };
  });
  legendModel.set({
    colors: colors,
    avg: rule.stats.avg_val,
    state: 'success'
  });
};

ModelUpdater.prototype._updateCategoryLegendModel = function (legendModel, rule) {
  var categories = rule.filters.map(function (filter, index) {
    return { label: filter, value: rule.values[index] };
  });
  legendModel.set({
    categories: categories,
    defaultValue: rule['default-value'],
    state: 'success'
  });
};

ModelUpdater.prototype._updateBubbleLegendModel = function (legendModel, rule) {
  var values = [
    rule.stats.min_val
  ].concat(rule.filters)
  .concat(rule.stats.max_val);

  var sizes = rule.values;
  if (rule.mapping === '>') {
    sizes.unshift(rule['default-value']);
  } else {
    sizes.push(rule['default-value']);
  }

  legendModel.set({
    values: values,
    sizes: sizes,
    avg: rule.stats.avg_val,
    state: 'success'
  });
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
  // TODO: Improve this
  var legendModels = this._layersCollection.chain()
    .map(this._getLayerLegends)
    .compact()
    .flatten()
    .value();

  _.each(legendModels, function (legendModel) {
    // TODO: Abstract this
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
