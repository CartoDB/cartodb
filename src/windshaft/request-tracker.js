var _ = require('underscore');

/**
 * Keeps track of subsequent equal requests to the Maps API
 * @param {number} maxNumberOfRequests Maximum number of subsequent requests allowed
 */
var RequestTracker = function (maxNumberOfRequests) {
  this._maxNumberOfRequests = maxNumberOfRequests || 3;
  this.reset();
};

RequestTracker.prototype.track = function (request, response) {
  if (!this.lastRequestEquals(request) || !this.lastResponseEquals(response)) {
    this.reset();
  }

  if (!this.maxNumberOfRequestsReached()) {
    this._lastRequest = request;
    this._lastResponse = response;
    this._numberOfRequests += 1;
  }
};

RequestTracker.prototype.reset = function () {
  this._lastRequest = undefined;
  this._lastResponse = undefined;
  this._numberOfRequests = 0;
};

RequestTracker.prototype.canRequestBePerformed = function (request) {
  return !this.maxNumberOfRequestsReached() ||
    (this.maxNumberOfRequestsReached() && !this.lastRequestEquals(request));
};

RequestTracker.prototype.maxNumberOfRequestsReached = function () {
  return this._numberOfRequests === this._maxNumberOfRequests;
};

RequestTracker.prototype.lastRequestEquals = function (request) {
  return this._lastRequest && this._lastRequest.equals(request);
};

RequestTracker.prototype.lastResponseEquals = function (response) {
  return _.isEqual(this._lastResponse, response);
};

module.exports = RequestTracker;
