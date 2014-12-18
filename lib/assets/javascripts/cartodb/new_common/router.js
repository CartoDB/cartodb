var Backbone = require('backbone');

module.exports = Backbone.Router.extend({
  navigate: function(route, opts) {
    // TODO: why is necessary to remove the prefixUrl?
    route = route.replace(cdb.config.prefixUrl(), '');

    Backbone.Router.prototype.navigate.call(this, route, opts);
  }
});
