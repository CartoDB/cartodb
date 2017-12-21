var ConfigModel = require('./data/config-model');
var deepInsights = require('../deep-insights/index');
var LayerStyleCollection = require('./embed/style-collection');
var EmbedIntegrations = require('./embed/embed-integrations');
var MetricsTracker = require('./components/metrics/metrics-tracker');
var WebGLMetrics = require('./components/metrics/webgl-metrics');
require('whatwg-fetch');

var _ = require('underscore');
var URLStateHelper = require('../deep-insights/api/url-helper.js');
var vizJSON = window.vizJSON;
var cartoLogoOption = _.findWhere(vizJSON.overlays, {type: 'logo'});
var dashboardOpts = {
  no_cdn: false,
  cartodb_logo: cartoLogoOption !== undefined,
  renderMenu: vizJSON.options.dashboard_menu,
  share_urls: true,
  authToken: window.authTokens,
  layerSelectorEnabled: true,
  mapzenApiKey: window.mapzenApiKey
};
var stateJSON = window.stateJSON;
var layersData = window.layersData;
var configModel = new ConfigModel({ base_url: window.baseURL });

var stateFromURL = URLStateHelper.getStateFromCurrentURL();
if (stateFromURL && !_.isEmpty(stateFromURL)) {
  _.extend(dashboardOpts, {
    state: stateFromURL
  });
} else if (stateJSON && stateJSON !== '{}') {
  _.extend(dashboardOpts, {
    state: stateJSON
  });
}

var layerStyleCollection = new LayerStyleCollection();
layerStyleCollection.resetByLayersData(layersData);

MetricsTracker.init({
  visId: vizJSON.id,
  configModel: configModel
});

deepInsights.createDashboard('#dashboard', vizJSON, dashboardOpts, function (error, dashboard) {
  if (error) {
    console.error('Dashboard has some errors:', error);
  }

  var map = dashboard.getMap().map;
  var scrollwheel = vizJSON.options.scrollwheel;
  var method = scrollwheel ? 'enableScrollWheel' : 'disableScrollWheel';
  map && map[method] && map[method]();

  var embedIntegrations = new EmbedIntegrations({
    deepInsightsDashboard: dashboard,
    layerStyleCollection: layerStyleCollection
  });

  if (Math.random() < 0.02) {
    MetricsTracker.track('WebGL stats', WebGLMetrics.getWebGLStats());
  }

  window.embedIntegrations = embedIntegrations;
});

window.layerStyleCollection = layerStyleCollection;
