require('whatwg-fetch');
require('promise-polyfill');

var FastClick = require('fastclick');
FastClick.attach(document.body);

var $ = require('jquery');
var _ = require('underscore');
var ConfigModel = require('builder/data/config-model');
var LayerStyleCollection = require('builder/embed/style-collection');
var MetricsTracker = require('builder/components/metrics/metrics-tracker');
var deepInsights = require('deep-insights/index');
var EmbedIntegrations = require('builder/embed/embed-integrations');
var URLStateHelper = require('deep-insights/api/url-helper.js');
var EmbedView = require('builder/embed/embed-view');
var utils = require('builder/helpers/utils');

const BANNER_ACCOUNTS = ['FREE'];

var vizJSON = window.vizJSON;
var authTokens = window.authTokens;
var stateJSON = window.stateJSON;
var layersData = window.layersData;
var ownerData = window.ownerData;
var anyLayerWithLegends = vizJSON.layers.some(function (layer) {
  return layer.legends && layer.legends.length;
});

var configModel = new ConfigModel({ base_url: ownerData.base_url });

var layerStyleCollection = new LayerStyleCollection();
layerStyleCollection.resetByLayersData(layersData);

var embedView = new EmbedView({
  title: vizJSON.title,
  description: utils.stripHTML(vizJSON.description),
  showMenu: vizJSON.options.dashboard_menu,
  showLegends: vizJSON.options.legends && anyLayerWithLegends,
  showLayerSelector: !!vizJSON.options.layer_selector,
  showBanner: ownerData && (BANNER_ACCOUNTS.indexOf(ownerData.account_type) > -1)
});

MetricsTracker.init({
  visId: vizJSON.id,
  configModel: configModel
});

$('#dashboard').prepend(embedView.render().$el);

var cartoLogoOption = _.findWhere(vizJSON.overlays, {type: 'logo'});
var dashboardOpts = {
  no_cdn: false,
  cartodb_logo: cartoLogoOption !== undefined,
  renderMenu: vizJSON.options.dashboard_menu,
  share_urls: true,
  authToken: authTokens,
  layerSelectorEnabled: true
};

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

deepInsights.createDashboard('.js-embed-map', vizJSON, dashboardOpts, function (error, dashboard) {
  if (error) {
    window.trackJs && window.trackJs.console.log({
      type: 'Dashboard:',
      data: error
    });
  }

  var map = dashboard.getMap().map;
  var scrollwheel = vizJSON.options.scrollwheel;
  var method = scrollwheel ? 'enableScrollWheel' : 'disableScrollWheel';
  map && map[method] && map[method]();

  embedView.injectTitle($('.js-embed-map'));

  var embedIntegrations = new EmbedIntegrations({
    deepInsightsDashboard: dashboard,
    layerStyleCollection: layerStyleCollection
  });

  window.embedIntegrations = embedIntegrations;
});

window.layerStyleCollection = layerStyleCollection;
