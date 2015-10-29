var Backbone = require('backbone-proxy').get();

// NOTE only for usage in core bundle (where Backbone is not available)
function _Promise() { }
_Promise.prototype = Backbone.Events;
_Promise.prototype.done = function(fn) {
    return this.on('done', fn);
}
_Promise.prototype.error = function(fn) {
    return this.on('error', fn);
}
module.exports = _Promise;
