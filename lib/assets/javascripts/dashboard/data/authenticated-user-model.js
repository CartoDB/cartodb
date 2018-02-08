var Backbone = require('backbone');

module.exports = Backbone.Model.extend({
  defaults: {
    username: '',
    avatar_url: ''
  },

  url: function () {
    return '//' + this.getHost() + '/api/v3/me';
  },

  getHost: function () {
    var currentHost = window.location.host;
    return this.get('host') ? this.get('host') : currentHost;
  }
});
