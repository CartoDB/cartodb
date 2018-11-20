var _ = require('underscore');
var MetricsModel = require('./metrics-model');
var MetricsTypes = require('./metrics-types');

/**
 *  Metrics singleton tracker.
 *  It sends any event to metrics endpoint.
 */

module.exports = (function () {
  return {
    init: function (opts) {
      if (!opts || !opts.configModel) { throw new Error('configModel is required'); }

      this._userId = opts.userId;
      this._visId = opts.visId;
      this._configModel = opts.configModel;
    },

    track: function (eventName, eventProperties) {
      if (!eventName) { throw new Error('eventName is required'); }
      this._checkEventIsConfigured(eventName);

      var metricModel = new MetricsModel({
        eventName: eventName,
        eventProperties: eventProperties
      }, {
        userId: this._userId,
        visId: this._visId,
        configModel: this._configModel
      });

      metricModel.save();
    },

    _checkEventIsConfigured: function (eventName) {
      var allowed = _.values(MetricsTypes);
      if (!_.contains(allowed, eventName)) {
        throw new Error(`"${eventName}" is not an allowed event type`);
      }
    }
  };
})();
