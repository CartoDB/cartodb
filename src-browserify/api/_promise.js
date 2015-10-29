var _ = require('underscore');
var Backbone = require('backbone');

// NOTE only for usage in non-core bundles (where Backbone is available)
function _Promise() {
}

_.extend(_Promise.prototype, Backbone.Events, {
  done: function(fn) {
    return this.bind('done', fn);
  },
  error: function(fn) {
    return this.bind('error', fn);
  }
});

module.exports = _Promise;
