var _ = require('underscore');
var BackbonePoller = require('backbone-poller');

function AnalysisPoller () {
  this._pollers = [];
}

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
  if (this._canBePolled(analysisModel)) {
    var poller = this._createPoller(analysisModel);
    poller.start();
  }
};

AnalysisPoller.prototype._canBePolled = function (analysisModel) {
  return analysisModel.url() && !analysisModel.isDone();
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
