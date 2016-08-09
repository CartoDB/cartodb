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
});
