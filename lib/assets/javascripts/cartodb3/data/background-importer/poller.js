var _ = require('underscore');

/*
 * Periodically fetches a model/collection. It waits for ongoing
 * fetch requests before trying to fetch again. A stop condition
 * can be specified.
 *
 * Usage example:
 *
 * var poller = new Poller(model, {
 *   interval: 1000,
 *   stopWhen: function (model) {
 *     return model.get('state') === 'completed';
 *   }
 * });
 *
 * poller.start();
 *
 * // ...
 *
 * poller.stop();
 *
 */
var Poller = function (model, opts) {
  this.model = model;
  this.numberOfRequests = 0;
  this.polling = false;
  this.interval = opts.interval;
  if (typeof this.interval !== 'function') {
    this.interval = function () { return opts.interval; };
  }
  this.stopWhen = opts.stopWhen;
  this.error = opts.error;
  this.autoStart = opts.autoStart;

  if (this.autoStart) {
    this.start();
  }
};

Poller.prototype.start = function () {
  if (this.timeout) {
    return;
  }

  this._scheduleFetch();
};

Poller.prototype._scheduleFetch = function () {
  this.timeout = setTimeout(this._fetch.bind(this), this.interval(this.numberOfRequests));
};

Poller.prototype._fetch = function () {
  var self = this;
  if (!self.polling) {
    self.polling = true;
    self.model.fetch({
      success: function () {
        self.polling = false;
        self.numberOfRequests++;
        if (self._continuePolling()) {
          self._scheduleFetch();
        }
      },
      error: function (e) {
        _.isFunction(self.error) && self.error(self.model);
      }
    });
  }
};

Poller.prototype._continuePolling = function () {
  return !this.stopWhen ||
    (_.isFunction(this.stopWhen) && !this.stopWhen(this.model));
};

Poller.prototype.stop = function () {
  this.polling = false;
  clearTimeout(this.timeout);
  delete this.timeout;
};

module.exports = Poller;
