var Backbone = require('backbone');

/**
 * A collection representing a set of users in a group.
 */
module.exports = Backbone.Collection.extend({
  initialize: function (models, opts) {
    if (!opts.group) throw new Error('group is required');
    this.group = opts.group;
    this.configModel = opts.configModel;
  },

  url: function () {
    var baseUrl = this.configModel.get('base_url');
    return baseUrl + '/' + this.group.url.apply(this.group, arguments) + '/users';
  },

  parse: function (response) {
    this.total_entries = response.total_entries;
    this.total_user_entries = response.total_user_entries;

    return response.users;
  },

  totalCount: function () {
    return this.total_user_entries;
  }

});
