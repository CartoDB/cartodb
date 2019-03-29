const _ = require('underscore');
const Poller = require('./poller');

const GeocodingModelPoller = function (model) {
  const POLLING_INTERVAL = 2000;

  const options = {
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
