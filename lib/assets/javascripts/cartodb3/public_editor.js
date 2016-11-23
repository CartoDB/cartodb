var deepInsights = require('cartodb-deep-insights.js');
var _ = require('underscore');
var URLStateHelper = require('cartodb-deep-insights.js/src/api/url-helper.js');
var vizJSON = window.vizJSON;
vizJSON.overlays = _.reject(vizJSON.overlays, {type: 'layer_selector'});

var cartoLogoOption = _.findWhere(vizJSON.overlays, {type: 'logo'});
var dashboardOpts = {
  no_cdn: false,
  cartodb_logo: cartoLogoOption !== undefined,
  renderMenu: vizJSON.options.dashboard_menu,
  share_urls: true,
  authToken: window.authTokens,
  layerSelectorEnabled: true,
  autoStyle: window.autoStyle
};
var stateJSON = window.stateJSON;
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
deepInsights.createDashboard('#dashboard', vizJSON, dashboardOpts, function (error, dashboard) {
  if (error) {
    console.error('Dashboard has some errors:', error);
  }

  var map = dashboard.getMap().map;
  var scrollwheel = vizJSON.options.scrollwheel;
  var method = scrollwheel ? 'enableScrollWheel' : 'disableScrollWheel';
  map && map[method] && map[method]();
});
