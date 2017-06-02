var LayersIntegration = require('./deep-insights-integration/layers-integration');
var WidgetsIntegration = require('./deep-insights-integration/widgets-integration');
var AnalysesIntegration = require('./deep-insights-integration/analyses-integration');
var MapIntegration = require('./deep-insights-integration/map-integration');
var LegendsIntegration = require('./deep-insights-integration/legends-integration');
var OverlaysIntegration = require('./deep-insights-integration/overlays-integration');
var FeaturesIntegration = require('./deep-insights-integration/features-integration');

var DIDashboardHelpers = require('./deep-insights-integration/deep-insights-helpers');
var checkAndBuildOpts = require('./helpers/required-opts');

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
var F = function (opts) {
  checkAndBuildOpts(opts, REQUIRED_OPTS, this);

  var diDashboardHelpers = new DIDashboardHelpers(this._deepInsightsDashboard);

  AnalysesIntegration.track({
    diDashboardHelpers: diDashboardHelpers,
    analysisDefinitionsCollection: this._analysisDefinitionsCollection,
    analysisDefinitionNodesCollection: this._analysisDefinitionNodesCollection,
    layerDefinitionsCollection: this._layerDefinitionsCollection,
    onboardings: this._onboardings,
    userModel: this._userModel
  });

  WidgetsIntegration.track({
    diDashboardHelpers: diDashboardHelpers,
    layerDefinitionsCollection: this._layerDefinitionsCollection,
    widgetDefinitionsCollection: this._widgetDefinitionsCollection
  });

  LegendsIntegration.track({
    diDashboardHelpers: diDashboardHelpers,
    legendDefinitionsCollection: this._legendDefinitionsCollection
  });

  OverlaysIntegration.track({
    diDashboardHelpers: diDashboardHelpers,
    overlayDefinitionsCollection: this._overlayDefinitionsCollection
  });

  LayersIntegration.track({
    analysisDefinitionNodesCollection: this._analysisDefinitionNodesCollection,
    diDashboardHelpers: diDashboardHelpers,
    editFeatureOverlay: this._editFeatureOverlay,
    layerDefinitionsCollection: this._layerDefinitionsCollection,
    legendDefinitionsCollection: this._legendDefinitionsCollection,
    // TODO: implement widget integration and pass it to layers integration
    // widgetDefinitionsCollectionIntegration: whatever,
    // TODO: implement map integration and pass it to the layers integration
    // mapDefinitionIntegration: whatever,
    // TODO: implement analysisDefinitionNodesCollection integration and pass it? to the layers integration
    // analysisDefinitionNodesCollectionIntegration: whatever,
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
    mapDefinitionModel: this._mapDefinitionModel,
    stateDefinitionModel: this._stateDefinitionModel,
    visDefinitionModel: this._visDefinitionModel
  });
};

module.exports = F;
