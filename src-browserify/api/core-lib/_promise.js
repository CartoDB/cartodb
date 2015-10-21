// NOTE this does not return a _Promise directly, but a wrapper, to inject the dependencies
// e.g. var _Promise = require('./_promise')(Backbone.Events)
// @param {Object} BackboneEvents
module.exports = function(BackboneEvents) {
  if (!BackboneEvents) throw new Error('BackboneEvents is required');

  var _Promise = function _Promise() { }
  _Promise.prototype = BackboneEvents;
  _Promise.prototype.done = function(fn) {
      return this.on('done', fn);
  }
  _Promise.prototype.error = function(fn) {
      return this.on('error', fn);
  }
  return _Promise;
};
