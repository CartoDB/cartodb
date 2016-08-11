var deepInsights = require('cartodb-deep-insights.js');
var _ = require('underscore');
var vizJSON = _.extend(
  window.vizJSON,
  {
    legends: false
  }
);
deepInsights.createDashboard('#dashboard', vizJSON, {
  no_cdn: false,
  cartodb_logo: false,
  renderMenu: true,
  share_urls: true,
  authToken: window.authTokens
}, function (error, dashboard) {
  if (error) {
    console.error('Dashboard has some errors:', error);
  }

  var map = dashboard.getMap().map;
  var scrollwheel = vizJSON.scrollwheel;
  var method = scrollwheel ? 'enableScrollWheel' : 'disableScrollWheel';
  map && map[method] && map[method]();
});
