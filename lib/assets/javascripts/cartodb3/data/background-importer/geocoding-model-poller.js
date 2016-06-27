var _ = require('underscore');
var Poller = require('./poller');

var GeocodingModelPoller = function (model) {
  var POLLING_INTERVAL = 2000;

  var options = {
    interval: POLLING_INTERVAL,
    stopWhen: function (model) {
      return model.hasFailed() || model.hasCompleted();
    },
    error: function (model) {
      model.trigger('change');
    }
  };

  Poller.call(this, model, options);
};

GeocodingModelPoller.prototype = _.extend({}, Poller.prototype);

module.exports = GeocodingModelPoller;
