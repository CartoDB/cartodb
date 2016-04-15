var _ = require('underscore');

/**
 * This class exposes a method that knows how to set/update the metadata on internal
 * CartoDB.js models that are linked to a "resource" in the Maps API.
 * @param {Object} deps Required depenecies
 */
var ModelUpdater = function (deps) {
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

  this._layerGroupModel = deps.layerGroupModel;
  this._layersCollection = deps.layersCollection;
  this._dataviewsCollection = deps.dataviewsCollection;
  this._analysisCollection = deps.analysisCollection;
};

ModelUpdater.prototype.updateModels = function (windhsaftMap, sourceLayerId, forceFetch) {
  this._updateLayerGroupModel(windhsaftMap);
  this._updateLayerModels(windhsaftMap);
  this._updateDataviewModels(windhsaftMap, sourceLayerId, forceFetch);
  this._updateAnalysisModels(windhsaftMap);
};

ModelUpdater.prototype._updateLayerGroupModel = function (windshaftMap) {
  this._layerGroupModel.set({
    baseURL: windshaftMap.getBaseURL(),
    urls: windshaftMap.getTiles('mapnik')
  });
};

ModelUpdater.prototype._updateLayerModels = function (windshaftMap) {
  var LAYER_TYPES = [ 'CartoDB', 'torque' ];
  _.each(this._layersCollection.select(function (layerModel) {
    return LAYER_TYPES.indexOf(layerModel.get('type')) >= 0;
  }), function (layerModel, layerIndex) {
    layerModel.set('meta', windshaftMap.getLayerMetadata(layerIndex));
    if (layerModel.get('type') === 'torque') {
      layerModel.set('urls', windshaftMap.getTiles('torque'));
    }
  }, this);
};

ModelUpdater.prototype._updateDataviewModels = function (windshaftMap, sourceLayerId, forceFetch) {
  this._dataviewsCollection.each(function (dataviewModel) {
    var dataviewMetadata = windshaftMap.getDataviewMetadata(dataviewModel.get('id'));
    if (dataviewMetadata) {
      dataviewModel.set({
        url: dataviewMetadata.url[this._getProtocol()]
      }, {
        sourceLayerId: sourceLayerId,
        forceFetch: forceFetch
      });
    }
  }, this);
};

ModelUpdater.prototype._updateAnalysisModels = function (windshaftMap) {
  this._analysisCollection.each(function (analysisNode) {
    var analysisMetadata = windshaftMap.getAnalysisNodeMetadata(analysisNode.get('id'));
    if (analysisMetadata) {
      analysisNode.set({
        status: analysisMetadata.status,
        query: analysisMetadata.query,
        url: analysisMetadata.url[this._getProtocol()]
      });
    }
  }, this);
};

ModelUpdater.prototype._getProtocol = function () {
  return window.location.protocol.replace(':', '');
};

module.exports = ModelUpdater;
