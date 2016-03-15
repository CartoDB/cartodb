var cdb = require('cartodb-deep-insights.js');
cdb.deepInsights.createDashboard('#dashboard', window.vizJSON, {
  no_cdn: false,
  cartodb_logo: false,
  renderMenu: true
});
