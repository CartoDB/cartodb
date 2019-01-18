var LayersIntegration = require('./deep-insights-integration/layers-integration');
var WidgetsIntegration = require('./deep-insights-integration/widgets-integration');
var AnalysesIntegration = require('./deep-insights-integration/analyses-integration');
var MapIntegration = require('./deep-insights-integration/map-integration');
var LegendsIntegration = require('./deep-insights-integration/legends-integration');
var OverlaysIntegration = require('./deep-insights-integration/overlays-integration');
var FeaturesIntegration = require('./deep-insights-integration/features-integration');

var DIDashboardHelpers = require('./deep-insights-integration/deep-insights-helpers');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'analysisDefinitionNodesCollection',
  'analysisDefinitionsCollection',
  'configModel',
  'deepInsightsDashboard',
  'editFeatureOverlay',
  'editorModel',
  'layerDefinitionsCollection',
  'legendDefinitionsCollection',
  'mapDefinitionModel',
  'mapModeModel',
  'onboardings',
  'overlayDefinitionsCollection',
  'stateDefinitionModel',
  'userModel',
  'visDefinitionModel',
  'widgetDefinitionsCollection'
];

/**
 * Integration between various data collections/models with cartodb.js and deep-insights.js.
 */
module.exports = function (opts) {
  checkAndBuildOpts(opts, REQUIRED_OPTS, this);

  var diDashboardHelpers = new DIDashboardHelpers(this._deepInsightsDashboard);

  AnalysesIntegration.track({
    diDashboardHelpers: diDashboardHelpers,
    analysisDefinitionsCollection: this._analysisDefinitionsCollection,
    analysisDefinitionNodesCollection: this._analysisDefinitionNodesCollection,
    layerDefinitionsCollection: this._layerDefinitionsCollection,
    onboardings: this._onboardings,
    userModel: this._userModel,
    visDefinitionModel: this._visDefinitionModel
  });

  WidgetsIntegration.track({
    diDashboardHelpers: diDashboardHelpers,
    layerDefinitionsCollection: this._layerDefinitionsCollection,
    widgetDefinitionsCollection: this._widgetDefinitionsCollection,
    analysisDefinitionNodesCollection: this._analysisDefinitionNodesCollection
  });

  LegendsIntegration.track({
    diDashboardHelpers: diDashboardHelpers,
    legendDefinitionsCollection: this._legendDefinitionsCollection
  });

  OverlaysIntegration.track({
    diDashboardHelpers: diDashboardHelpers,
    overlayDefinitionsCollection: this._overlayDefinitionsCollection
  });

  FeaturesIntegration.track({
    configModel: this._configModel,
    diDashboardHelpers: diDashboardHelpers,
    editFeatureOverlay: this._editFeatureOverlay,
    layerDefinitionsCollection: this._layerDefinitionsCollection,
    mapModeModel: this._mapModeModel,
    userModel: this._userModel
  });

  MapIntegration.track({
    diDashboardHelpers: diDashboardHelpers,
    editorModel: this._editorModel,
    mapDefinitionModel: this._mapDefinitionModel,
    stateDefinitionModel: this._stateDefinitionModel,
    visDefinitionModel: this._visDefinitionModel
  });

  LayersIntegration.track({
    analysisDefinitionNodesCollection: this._analysisDefinitionNodesCollection,
    diDashboardHelpers: diDashboardHelpers,
    editFeatureOverlay: this._editFeatureOverlay,
    layerDefinitionsCollection: this._layerDefinitionsCollection,
    legendDefinitionsCollection: this._legendDefinitionsCollection
  });

  LayersIntegration.bind('onLayerCreation', function (nodeDefModel) {
    AnalysesIntegration.analyseDefinitionNode(nodeDefModel);
  });

  LayersIntegration.bind('onLayerChanged', function (layerDefinitionModel) {
    WidgetsIntegration.manageTimeSeriesForTorque(layerDefinitionModel);
  });

  LayersIntegration.bind('onBaseLayerChanged', function () {
    MapIntegration.setMapConverters();
  });
};
