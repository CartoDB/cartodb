var _ = require('underscore');
var BackbonePoller = require('backbone-poller');

var AnalysisPoller = function () {
  this._pollers = [];
};

AnalysisPoller.CONFIG = {
  START_DELAY: 1000,
  MAX_DELAY: Infinity,
  DELAY_MULTIPLIER: 1.5
};

AnalysisPoller.prototype.resetAnalysisNodes = function (analysisModels) {
  this.reset();
  _.each(analysisModels, function (analysisModel) {
    this._poll(analysisModel);
  }, this);
};

AnalysisPoller.prototype._poll = function (analysisModel) {
  if (analysisModel.url()) {
    var poller = this._findOrCreatePoller(analysisModel);
    if (analysisModel.hasChanged('url') && poller.active()) {
      poller.stop();
    }
    if (!analysisModel.isDone()) {
      poller.start();
    }
  }
};

AnalysisPoller.prototype._findOrCreatePoller = function (analysisModel) {
  var poller = this._findPoller(analysisModel);
  if (!poller) {
    poller = this._createPoller(analysisModel);
  }
  return poller;
};

AnalysisPoller.prototype._findPoller = function (analysisModel) {
  return _.find(this._pollers, function (poller) {
    return poller.model === analysisModel;
  });
};

AnalysisPoller.prototype._createPoller = function (analysisModel) {
  var pollerOptions = {
    delay: [
      AnalysisPoller.CONFIG.START_DELAY,
      AnalysisPoller.CONFIG.MAX_DELAY,
      AnalysisPoller.CONFIG.DELAY_MULTIPLIER
    ],
    condition: function (analysisModel) {
      return !analysisModel.isDone();
    }
  };

  var poller = BackbonePoller.get(analysisModel, pollerOptions);
  this._pollers.push(poller);
  return poller;
};

AnalysisPoller.prototype.reset = function () {
  BackbonePoller.reset();
  this._pollers = [];
};

module.exports = AnalysisPoller;
