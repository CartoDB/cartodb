var _ = require('underscore');
var BackbonePoller = require('backbone-poller');

var START_DELAY = 1000;
var MAX_DELAY = Infinity;
var DELAY_MULTIPLIER = 1.5;

var AnalysisPoller = {
  poll: function (analysisCollection) {
    if (!analysisCollection) {
      throw new Error('analysisCollection is required');
    }
    this._pollers = [];
    this._analysisCollection = analysisCollection;
    this._analysisCollection.bind('change:status', this._onAnalysisStatusChanged, this);
  },

  _onAnalysisStatusChanged: function (analysisModel) {
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
  }
}

module.exports = AnalysisPoller;
