/**
 * Keeps track of subsequent equal requests to the Maps API
 * @param {number} maxNumberOfRequests Maximum number of subsequent requests allowed
 */
var RequestTracker = function (maxNumberOfRequests) {
  this._maxNumberOfRequests = maxNumberOfRequests || 3;
  this.reset();
};

RequestTracker.prototype.track = function (request) {
  if (this._lastRequest && !this._lastRequest.equals(request)) {
    this.reset();
  }

  if (!this.maxNumberOfRequestsReached()) {
    this._lastRequest = request;
    this._numberOfRequests += 1;
  }
};

RequestTracker.prototype.reset = function () {
  this._lastRequest = undefined;
  this._numberOfRequests = 0;
};

RequestTracker.prototype.maxNumberOfRequestsReached = function () {
  return this._numberOfRequests === this._maxNumberOfRequests;
};

RequestTracker.prototype.lastRequestEquals = function (request) {
  return this._lastRequest && this._lastRequest.equals(request);
};

module.exports = RequestTracker;
