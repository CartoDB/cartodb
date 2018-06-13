var MetricsModel = require('./metrics-model');

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

      var metricModel = new MetricsModel({
        eventName: eventName,
        eventProperties: eventProperties
      }, {
        userId: this._userId,
        visId: this._visId,
        configModel: this._configModel
      });

      metricModel.save();
    }
  };
})();
