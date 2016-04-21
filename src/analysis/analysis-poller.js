var _ = require('underscore');
var BackbonePoller = require('backbone-poller');

var AnalysisPoller = {
  poll: function (analysisModel) {
    this._pollers = [];
    var poller = this._findOrCreatePoller(analysisModel);
    if (analysisModel.hasChanged('url') && poller.active()) {
      poller.stop();
    }
    if (!analysisModel.isDone()) {
      poller.start();
    }
  },

  _findOrCreatePoller: function (analysisModel) {
    var poller = this._findPoller(analysisModel);
    if (!poller) {
      poller = this._createPoller(analysisModel);
    }
    return poller;
  },

  _findPoller: function (analysisModel) {
    return _.find(this._pollers, function (poller) {
      return poller.model === analysisModel;
    });
  },

  _createPoller: function (analysisModel) {
    var pollerOptions = {
      delay: [
        this.CONFIG.START_DELAY,
        this.CONFIG.MAX_DELAY,
        this.CONFIG.DELAY_MULTIPLIER
      ],
      condition: function (analysisModel) {
        return !analysisModel.isDone();
      }
    };

    var poller = BackbonePoller.get(analysisModel, pollerOptions);
    this._pollers.push(poller);
    return poller;
  },

  reset: function () {
    BackbonePoller.reset();
    this._pollers = [];
  }
};

AnalysisPoller.CONFIG = {
  START_DELAY: 1000,
  MAX_DELAY: Infinity,
  DELAY_MULTIPLIER: 1.5
};

module.exports = AnalysisPoller;
