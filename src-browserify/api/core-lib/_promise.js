var BackboneEventsIsch = require('./backbone-events-isch');

// might be provided in src/api/layers
var _Promise = function _Promise() { }
_Promise.prototype = BackboneEventsIsch;
_Promise.prototype.done = function(fn) {
    return this.on('done', fn);
}
_Promise.prototype.error = function(fn) {
    return this.on('error', fn);
}

module.exports = _Promise;
