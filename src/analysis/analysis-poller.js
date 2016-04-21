var _ = require('underscore');
var BackbonePoller = require('backbone-poller');

var START_DELAY = 1000;
var MAX_DELAY = Infinity;
var DELAY_MULTIPLIER = 1.5;

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
      delay: [START_DELAY, MAX_DELAY, DELAY_MULTIPLIER],
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

module.exports = AnalysisPoller;
