var deepInsights = require('cartodb-deep-insights.js');
var _ = require('underscore');
var URLHelper = require('./helpers/url-helper');

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
var stateFromURL = URLHelper.getStateFromCurrentURL();

if (stateFromURL && stateFromURL !== '{}') {
  _.extend(opts, {
    state: stateFromURL
  });
} else if (stateJSON && stateJSON !== '{}') {
  _.extend(opts, {
    state: stateJSON
  });
}

deepInsights.createDashboard('#dashboard', vizJSON, opts);
