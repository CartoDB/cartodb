var _ = require('underscore');
var layerTypesAndKinds = require('builder/data/layer-types-and-kinds');
var BaseTiledLayerView = require('./layer-views/base-tiled-layer-view');
var PlainColorLayerView = require('./layer-views/plain-color-layer-view');
var BackgroundImageLayerView = require('./layer-views/background-image-layer-view');
var GoogleMapsBaseLayerView = require('./layer-views/google-maps-base-layer-view');
var DataLayerView = require('./layer-views/data-layer-view');
var ErroredDataLayerView = require('./layer-views/errored-data-layer-view');
var LabelsLayerView = require('./layer-views/labels-layer-view');
var LayerAnalysesView = require('./layer-analyses-view');
var LayerAnalysisViewFactory = require('./layer-analysis-view-factory');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'userActions',
  'layerDefinitionsCollection',
  'analysisDefinitionNodesCollection',
  'modals',
  'configModel',
  'sortableSelector',
  'stateDefinitionModel',
  'visDefinitionModel',
  'widgetDefinitionsCollection'
];

var LayerViewFactory = function (opts) {
  opts = opts || {};
  checkAndBuildOpts(opts, REQUIRED_OPTS, this);
};

LayerViewFactory.prototype.createLayerView = function (layerDefinitionModel) {
  var layerViewOptions = {
    model: layerDefinitionModel,
    modals: this._modals,
    stateDefinitionModel: this._stateDefinitionModel,
    configModel: this._configModel
  };

  if (layerDefinitionModel.isDataLayer()) {
    layerViewOptions = _.extend(layerViewOptions, {
      userActions: this._userActions,
      layerDefinitionsCollection: this._layerDefinitionsCollection,
      newAnalysesView: this._newAnalysesView.bind(this),
      widgetDefinitionsCollection: this._widgetDefinitionsCollection,
      visDefinitionModel: this._visDefinitionModel,
      analysisDefinitionNodesCollection: this._analysisDefinitionNodesCollection
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
  if (this._isGoogleMapsBaseLayer(layerDefinitionModel)) {
    return GoogleMapsBaseLayerView;
  }

  // Data layers
  if (layerDefinitionModel.isDataLayer()) {
    var nodeDefModel = layerDefinitionModel.getAnalysisDefinitionNodeModel();
    if (nodeDefModel) {
      return DataLayerView;
    } else {
      // Ghost node layer (😱)
      return ErroredDataLayerView;
    }
  }

  // Labels layer
  if (this.isLabelsLayer(layerDefinitionModel)) {
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

LayerViewFactory.prototype._isGoogleMapsBaseLayer = function (layerDefinitionModel) {
  var layerType = layerDefinitionModel.get('type');
  return layerTypesAndKinds.isGMapsBase(layerType) &&
    this._isBaseLayer(layerDefinitionModel);
};

LayerViewFactory.prototype.isLabelsLayer = function (layerDefinitionModel) {
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
