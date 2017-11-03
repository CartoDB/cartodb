var _ = require('underscore');
var Poller = require('./poller');

var ImportModelPoller = function (model) {
  var POLLING_INTERVAL = 2000; // Interval time between poll checkings
  var POLLING_INTERVAL_MULTIPLIER = 2.5; // Multiply interval by this number
  var POLLING_REQUESTS_BEFORE_INTERVAL_CHANGE = 30; // Max tries until interval change

  var options = {
    interval: function (numberOfRequests) {
      if (numberOfRequests >= POLLING_REQUESTS_BEFORE_INTERVAL_CHANGE) {
        return POLLING_INTERVAL * POLLING_INTERVAL_MULTIPLIER;
      }
      return POLLING_INTERVAL;
    },
    stopWhen: function (model) {
      var state = model.get('state');
      return (state === 'complete' || state === 'failure');
    }
  };

  Poller.call(this, model, options);
};

ImportModelPoller.prototype = _.extend({}, Poller.prototype);

module.exports = ImportModelPoller;
