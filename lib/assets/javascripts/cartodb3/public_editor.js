var deepInsights = require('cartodb-deep-insights.js');
var _ = require('underscore');

var vizJSON = _.extend(
  window.vizJSON,
  {
    legends: false
  }
);

var opts = {
  no_cdn: false,
  cartodb_logo: false,
  renderMenu: true,
  share_urls: true
};

var stateJSON = window.stateJSON;
if (stateJSON && stateJSON !== '{}') {
  _.extend(opts, {
    state: stateJSON
  });
}

deepInsights.createDashboard('#dashboard', vizJSON, opts);
