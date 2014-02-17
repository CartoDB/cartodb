;(function() {

  /** 
   * abbrevations:
   *   i = increment
   *   d = decrement
   *   t = timing
   *   g = gauge
   */

  var statsc = {}; 
  var addr = 'http://localhost:8127/';

  /** 
   * Set the statsc server address.
   *
   * Use this if the server isnt listening on `http://localhost:8126`
   * or perhaps if you are using a custom `send` method.
   * 
   * @param  {String} _addr
   */
  statsc.connect = function(_addr) {
    addr = _addr;
  };  

  /** 
   * Increment the counter at `stat` by one.
   * 
   * @param  {string} stat
   * @param  {number} sampleRate
   */
  statsc.increment = function(stat, sampleRate) {
    statsc.send(['i', stat, sampleRate]);
  };  

  /** 
   * Decrement the counter at `stat` by one.
   * 
   * @param  {string} stat
   * @param  {number} sampleRate
   */
  statsc.decrement = function(stat, sampleRate) {
    statsc.send(['d', stat, sampleRate]);
  };  

  /** 
   * Set the gauge at `stat` to `value`.
   * 
   * @param  {string} stat
   * @param  {number} value
   * @param  {number} sampleRate
   */
  statsc.gauge = function(stat, value, sampleRate) {
    statsc.send(['g', stat, value, sampleRate]);
  };  

  /** 
   * Log `time` to `stat`.
   *
   * `time` can either be
   *   - a number in milliseconds
   *   - a Date object, created at the timer's start
   *   - a synchronous function to be timed
   * 
   * @param  {string}               stat
   * @param  {number|Date|function} time
   * @param  {number}               sampleRate
   */
  statsc.timing = function(stat, time, sampleRate) {
    if ('number' == typeof time) {
      return statsc.send(['t', stat, time, sampleRate]);
    }   
    if (time instanceof Date) {
      return statsc.send(['t', stat, fromNow(time), sampleRate]);
    }   
    if ('function' == typeof time) {
      var start = new Date();
      time();
      statsc.send(['t', stat, fromNow(start), sampleRate]);
    }   
  };  

  /** 
   * Timer utility in functional style.
   * 
   * Returns a function you can call when you want to mark your timer as
   * resolved.
   * 
   * @param  {string}   stat
   * @param  {number}   sampleRate
   * @return {function}
   */
  statsc.timer = function(stat, sampleRate) {
    var start = new Date().getTime();

    return function() {
      statsc.send(['t', stat, fromNow(start), sampleRate]);
    }   
  };  

  /** 
   * Standard implementation of a `send` method.
   *
   * Overwrite this if you want to use websockets or jsonp or whatever.
   *
   * @param {array} data
   */
  statsc.send = (function() {
    var queue = []; 
    var head = document.getElementsByTagName('head')[0];

    setInterval(function() {
      if (queue.length > 0) {
        // clear null values
        for (var i = 0; i < queue.length; i++) {
          for (var j = 0; j < queue[i].length; j++) {
            if (queue[i][j] == null) queue[i].splice(j, 1);
          }
        }

        var tag = document.createElement('script');
        tag.src = addr+JSON.stringify(queue);
        tag.onload = function () {
          head.removeChild(tag);
        }
        head.appendChild(tag);

        queue = [];
      }
    }, 5000);

    return function(data) { queue.push(data); }
    })();

  /**
   * Calculate the difference between `now` and the given Date object.
   * 
   * @param  {object} time
   * @return {number} difference in milliseconds
   */
  function fromNow(date) {
    return new Date() - date;
  }

  /**
   * Expose `statsc` to the world
   */
  if (typeof require == 'function' && module) {
    module.exports = statsc;
  }
  if (typeof window == 'object') {
    window.statsc = statsc;
  }

})();
