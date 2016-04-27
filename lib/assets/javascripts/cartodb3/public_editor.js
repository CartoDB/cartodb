var deepInsights = require('cartodb-deep-insights.js');
deepInsights.createDashboard('#dashboard', window.vizJSON, {
  no_cdn: false,
  cartodb_logo: false,
  renderMenu: true
});
