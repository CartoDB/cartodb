var _ = require('underscore');

var ERRORS = {
  generic: {
    level: 'error',
    refresh: true
  },
  limit: {
    level: 'error',
    error: 'Timeout',
    message: 'The server is taking too long to respond, due to poor conectivity or a temporary error with our servers. Please try again soon.',
    refresh: true
  },
  no_data_available: {
    level: 'alert',
    error: 'No data available',
    message: 'There are no results for the combination of filters applied to your data. Try tweaking your filters, or zoom and pan the map to adjust the Map View.',
    refresh: false
  },
  too_many_bins: {
    level: 'error',
    error: 'Too many bins returned',
    message: 'There are too many bins returned. Try selecting a less granular aggregation or filtering the data source.',
    refresh: false
  },
  dataview: {
    level: 'error',
    refresh: false
  }
};

module.exports = function (error) {
  var type = error && error.type && _.has(ERRORS, error.type)
    ? error.type
    : 'generic';
  return _.extend({}, error, ERRORS[type]);
};
