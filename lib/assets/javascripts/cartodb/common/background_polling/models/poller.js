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
  this.interval = options['interval'];
  this.condition = options['condition'];
  this.error = options['error'];
}

Poller.prototype.start = function() {
  var self = this;

  if (this.pollingInterval) {
    return;
  }

  var poll = function() {
    if (!self.polling) {
      self.polling = true;
      self.model.fetch({
        success: function() {
          self.polling = false;
          if (self.condition && self.condition(self.model)) {
            self.stop();
          }
        },
        error: function(e) {
          self.error && self.error();
        }
      })
    }
  }

  this.polling = false;
  this.pollingInterval = setInterval(poll, this.interval);
}

Poller.prototype.stop = function() {
  this.polling = false;
  clearInterval(this.pollingInterval);
  delete(this.pollingInterval);
}

module.exports = Poller;
