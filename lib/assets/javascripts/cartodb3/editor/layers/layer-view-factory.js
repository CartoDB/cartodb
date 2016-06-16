var _ = require('underscore');
var layerTypesAndKinds = require('../../data/layer-types-and-kinds');

var BasemapTiledLayerView = require('./layer-views/basemap-tiled-layer-view');
var BasemapPlainColorView = require('./layer-views/basemap-plain-color-layer-view');
var DataLayerView = require('./layer-views/data-layer-view');
var LabelsLayerView = require('./layer-views/labels-layer-view');

var LayerViewFactory = function (options) {
  options = options || {};
  if (!options.stackLayoutModel) { throw new Error('stackLayoutModel option is required'); }
  if (!options.layerDefinitionsCollection) { throw new Error('layerDefinitionsCollection option is required'); }
  if (!options.analysisDefinitionNodesCollection) { throw new Error('analysisDefinitionNodesCollection option is required'); }
  if (!options.analysis) { throw new Error('analysis option is required'); }

  this._stackLayoutModel = options.stackLayoutModel;
  this._layerDefinitionsCollection = options.layerDefinitionsCollection;
  this._analysisDefinitionNodesCollection = options.analysisDefinitionNodesCollection;
  this._analysis = options.analysis;
};

LayerViewFactory.prototype.createLayerView = function (layerDefinitionModel) {
  var layerViewOptions = {
    model: layerDefinitionModel,
    stackLayoutModel: this._stackLayoutModel
  };

  if (this._isDataLayer(layerDefinitionModel)) {
    layerViewOptions = _.extend(layerViewOptions, {
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      analysisDefinitionNodesCollection: this._analysisDefinitionNodesCollection,
      analysis: this._analysis
    });
  }

  var LayerViewClass = this._getLayerViewClass(layerDefinitionModel);
  return new LayerViewClass(layerViewOptions);
};

LayerViewFactory.prototype._getLayerViewClass = function (layerDefinitionModel) {
  if (this._isBaseLayer(layerDefinitionModel)) {
    if (this._isTiledLayer(layerDefinitionModel)) {
      return BasemapTiledLayerView;
    }
    if (this._isPlainColorBaseLayer(layerDefinitionModel)) {
      return BasemapPlainColorView;
    }
  }
  if (this._isLabelsLayer(layerDefinitionModel)) {
    return LabelsLayerView;
  }
  if (this._isDataLayer(layerDefinitionModel)) {
    return DataLayerView;
  }

  throw new Error('No layer view for type "' + layerDefinitionModel.get('type') + '"" just yet.');
};

LayerViewFactory.prototype._isBaseLayer = function (layerDefinitionModel) {
  return layerDefinitionModel.get('order') === 0;
};

LayerViewFactory.prototype._isPlainColorBaseLayer = function (layerDefinitionModel) {
  var layerType = layerDefinitionModel.get('type');
  return layerTypesAndKinds.isPlainType(layerType) &&
    layerDefinitionModel.get('color');
};

LayerViewFactory.prototype._isTiledLayer = function (layerDefinitionModel) {
  var layerType = layerDefinitionModel.get('type');
  return layerTypesAndKinds.isTiledType(layerType);
};

LayerViewFactory.prototype._isLabelsLayer = function (layerDefinitionModel) {
  return this._isTiledLayer(layerDefinitionModel) && !this._isBaseLayer(layerDefinitionModel);
};

LayerViewFactory.prototype._isDataLayer = function (layerDefinitionModel) {
  var layerType = layerDefinitionModel.get('type');
  return layerTypesAndKinds.isCartoDBType(layerType) ||
    layerTypesAndKinds.isTorqueType(layerType);
};

module.exports = LayerViewFactory;
