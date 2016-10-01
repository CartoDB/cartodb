var Backbone = require('backbone');

module.exports = Backbone.Model.extend({
  createIcon: function () {
    return this.get('createIcon');
  },

  type: function () {
    return this.get('type');
  },

  content: function () {
    return this.get('content');
  },

  url: function () {
    return this.get('url');
  },

  isPrivate: function () {
    return this.get('private');
  }
});
