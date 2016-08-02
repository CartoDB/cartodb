var Backbone = require('backbone');
var syncAbort = require('./backbone/sync-abort');

/**
 * A collection representing a set of users in a group.
 */
module.exports = Backbone.Collection.extend({

  sync: syncAbort,

  initialize: function (models, opts) {
    if (!opts.group) throw new Error('group is required');
    this.group = opts.group;
    this.configModel = opts.configModel;
    this.organization = opts.organization;
  },

  url: function (method) {
    var baseUrl = this.configModel.get('base_url');
    var version = this.configModel.urlVersion('organizationGroups', method);
    return baseUrl + '/api/' + version + '/organization/' + this.organization.id + '/groups/' + this.group.id + '/users';
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
