var Backbone = require('backbone');
var UserModel = require('./user-model');

/**
 * A collection representing a set of users in a group.
 */
module.exports = Backbone.Collection.extend({

  model: UserModel,

  initialize: function (models, opts) {
    if (!opts.group) throw new Error('group is required');
    this.group = opts.group;
  },

  url: function () {
    var baseUrl = this._configModel.get('base_url');
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
