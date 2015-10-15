var BackboneEventsIsch = require('./backbone-events-isch');

// might be provided in src/api/layers
var Promise = function _Promise() { }
Promise.prototype = BackboneEventsIsch;
Promise.prototype.done = function(fn) {
    return this.on('done', fn);
}
Promise.prototype.error = function(fn) {
    return this.on('error', fn);
}

module.exports = Promise;
