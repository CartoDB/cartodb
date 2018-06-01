const _ = require('underscore');
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
const Poller = function (model, options) {
  this.model = model;
  this.numberOfRequests = 0;
  this.polling = false;
  this.interval = options['interval'];

  if (typeof this.interval !== 'function') {
    this.interval = function () { return options['interval']; };
  }

  this.stopWhen = options['stopWhen'];
  this.error = options['error'];
  this.autoStart = options['autoStart'];

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
  if (!this.polling) {
    this.polling = true;
    this.model.fetch({
      success: function () {
        this.polling = false;
        this.numberOfRequests++;
        if (this._continuePolling()) {
          this._scheduleFetch();
        }
      },
      error: function (e) {
        _.isFunction(this.error) && this.error(this.model);
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
