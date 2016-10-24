var _ = require('underscore');
var layerTypesAndKinds = require('../../data/layer-types-and-kinds');
var BaseTiledLayerView = require('./layer-views/base-tiled-layer-view');
var PlainColorLayerView = require('./layer-views/plain-color-layer-view');
var BackgroundImageLayerView = require('./layer-views/background-image-layer-view');
var DataLayerView = require('./layer-views/data-layer-view');
var LabelsLayerView = require('./layer-views/labels-layer-view');
var LayerAnalysesView = require('./layer-analyses-view');
var LayerAnalysisViewFactory = require('./layer-analysis-view-factory');

var LayerViewFactory = function (options) {
  options = options || {};
  if (!options.stackLayoutModel) { throw new Error('stackLayoutModel is required'); }
  if (!options.userActions) { throw new Error('userActions is required'); }
  if (!options.layerDefinitionsCollection) { throw new Error('layerDefinitionsCollection is required'); }
  if (!options.analysisDefinitionNodesCollection) { throw new Error('analysisDefinitionNodesCollection is required'); }
  if (!options.modals) throw new Error('modals is required');
  if (!options.configModel) { throw new Error('configModel is required'); }
  if (!options.sortableSelector) { throw new Error('sortableSelector is required'); }

  this._stackLayoutModel = options.stackLayoutModel;
  this._userActions = options.userActions;
  this._layerDefinitionsCollection = options.layerDefinitionsCollection;
  this._analysisDefinitionNodesCollection = options.analysisDefinitionNodesCollection;
  this._modals = options.modals;
  this._configModel = options.configModel;
  this._sortableSelector = options.sortableSelector;
};

LayerViewFactory.prototype.createLayerView = function (layerDefinitionModel) {
  var layerViewOptions = {
    model: layerDefinitionModel,
    stackLayoutModel: this._stackLayoutModel,
    modals: this._modals
  };

  if (layerDefinitionModel.isDataLayer()) {
    layerViewOptions = _.extend(layerViewOptions, {
      userActions: this._userActions,
      configModel: this._configModel,
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      newAnalysesView: this._newAnalysesView.bind(this)
    });
  }

  var LayerViewClass = this._getLayerViewClass(layerDefinitionModel);
  return new LayerViewClass(layerViewOptions);
};

LayerViewFactory.prototype._getLayerViewClass = function (layerDefinitionModel) {
  // Base layers
  if (this._isTiledBaseLayer(layerDefinitionModel)) {
    return BaseTiledLayerView;
  }
  if (this._isPlainColorBaseLayer(layerDefinitionModel)) {
    return PlainColorLayerView;
  }
  if (this._isBackgroundImageBaseLayer(layerDefinitionModel)) {
    return BackgroundImageLayerView;
  }

  // Data layers
  if (layerDefinitionModel.isDataLayer()) {
    return DataLayerView;
  }

  // Labels layer
  if (this._isLabelsLayer(layerDefinitionModel)) {
    return LabelsLayerView;
  }

  throw new Error('No layer view for type "' + layerDefinitionModel.get('type') + '" just yet.');
};

LayerViewFactory.prototype._isBaseLayer = function (layerDefinitionModel) {
  return layerDefinitionModel.get('order') === 0;
};

LayerViewFactory.prototype._isTiledBaseLayer = function (layerDefinitionModel) {
  var layerType = layerDefinitionModel.get('type');
  return layerTypesAndKinds.isTiledType(layerType) &&
    this._isBaseLayer(layerDefinitionModel);
};

LayerViewFactory.prototype._isPlainColorBaseLayer = function (layerDefinitionModel) {
  var layerType = layerDefinitionModel.get('type');
  return layerTypesAndKinds.isPlainType(layerType) &&
    this._isBaseLayer(layerDefinitionModel) &&
      layerDefinitionModel.get('color');
};

LayerViewFactory.prototype._isBackgroundImageBaseLayer = function (layerDefinitionModel) {
  var layerType = layerDefinitionModel.get('type');
  return layerTypesAndKinds.isPlainType(layerType) &&
    this._isBaseLayer(layerDefinitionModel) &&
      layerDefinitionModel.get('image');
};

LayerViewFactory.prototype._isLabelsLayer = function (layerDefinitionModel) {
  var layerType = layerDefinitionModel.get('type');
  return layerTypesAndKinds.isTiledType(layerType) &&
    !this._isBaseLayer(layerDefinitionModel);
};

LayerViewFactory.prototype._newAnalysesView = function (el, layerDefinitionModel) {
  var layerAnalysisViewFactory = new LayerAnalysisViewFactory(this._analysisDefinitionNodesCollection);
  return new LayerAnalysesView({
    el: el,
    model: layerDefinitionModel,
    layerAnalysisViewFactory: layerAnalysisViewFactory,
    sortableSelector: this._sortableSelector
  });
};

module.exports = LayerViewFactory;
