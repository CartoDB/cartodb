var cdb = require('cartodb-deep-insights.js');

var dashboard = cdb.deepInsights.createDashboard('#dashboard', window.vizJSON, {
  no_cdn: false,
  cartodb_logo: false,
  renderMenu: true
});
