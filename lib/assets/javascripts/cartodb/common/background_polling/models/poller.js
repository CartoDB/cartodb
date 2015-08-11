/*
 * Periodically fetches a model/collection. It waits for ongoing 
 * fetch requests before trying to fetch again. A stop condition
 * can be specified.
 *
 * Usage example:
 * 
 * var poller = new Poller(model, {
 *   interval: 1000,
 *   condition: function(model) {
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
var Poller = function(model, options) {
  this.model = model;
  this.numberOfTries = 0;
  this.polling = false;
  this.interval = options['interval'];
  if (typeof this.interval !== "function") {
    this.interval = function() { return options['interval']; };
  }
  this.condition = options['condition'];
  this.error = options['error'];
  this.autoStart = options['autoStart'];

  if (this.autoStart) {
    this.start();
  }
}

Poller.prototype.start = function() {
  if (this.timeout) {
    return;
  }

  this._scheduleFetch();
}

Poller.prototype._scheduleFetch = function() {
  this.timeout = setTimeout(this._fetch.bind(this), this.interval(this.numberOfTries));
}

Poller.prototype._fetch = function() {
  var self = this;
  if (!self.polling) {
    self.polling = true;
    self.model.fetch({
      success: function() {
        self.polling = false;
        if (!self.condition || (self.condition && !self.condition(self.model))) {
          self.numberOfTries++;
          self._scheduleFetch();
        }
      },
      error: function(e) {
        self.error && self.error();
      }
    })
  }
}

Poller.prototype.stop = function() {
  this.polling = false;
  clearTimeout(this.timeout);
  delete(this.timeout);
}

module.exports = Poller;
