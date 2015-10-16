var Queue = function() {

  // callback storage
  this._methods = [];

  // reference to the response
  this._response = null;

  // all queues start off unflushed
  this._flushed = false;

};

Queue.prototype = {

  // adds callbacks to the queue
  add: function(fn) {

    // if the queue had been flushed, return immediately
    if (this._flushed) {

      // otherwise push it on the queue
      fn(this._response);

    } else {
      this._methods.push(fn);
    }

  },

  flush: function(resp) {

    // flush only ever happens once
    if (this._flushed) {
      return;
    }

    // store the response for subsequent calls after flush()
    this._response = resp;

    // mark that it's been flushed
    this._flushed = true;

    // shift 'em out and call 'em back
    while (this._methods[0]) {
      this._methods.shift()(resp);
    }

  }

};

module.exports = Queue;
