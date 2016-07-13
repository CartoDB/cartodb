var Backbone = require('backbone');
var _ = require('underscore');
var User = require('./user-model');
var syncAbort = require('./backbone/sync-abort');

/**
 *  Organization users collection
 *
 */
var DEFAULT_EXCLUDE_CURRENT_USER = true;

module.exports = Backbone.Collection.extend({

  model: User,

  sync: syncAbort,

  url: function () {
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/v1/organization/' + this._organization.id + '/users';
  },

  initialize: function (models, opts) {
    if (!opts.organization) {
      throw new Error('Organization is needed for fetching organization users');
    }
    this._configModel = opts.configModel;
    this._organization = opts.organization;
    this._currentUserId = opts.currentUserId;
  },

  comparator: function (mdl) {
    return mdl.get('username');
  },

  excludeCurrentUser: function (exclude) {
    exclude = !!exclude;
    this._excludeCurrentUser = exclude;
    if (exclude && !this._currentUserId) {
      console.error('set excludeCurrentUser to true, but there is no current user id set to exclude!');
    }
  },

  restoreExcludeCurrentUser: function () {
    this.excludeCurrentUser(DEFAULT_EXCLUDE_CURRENT_USER);
  },

  parse: function (r) {
    this.total_entries = r.total_entries;
    this.total_user_entries = r.total_user_entries;

    return _.reduce(r.users, function (memo, user) {
      if (this._excludeCurrentUser && user.id === this._currentUserId) {
        this.total_user_entries--;
        this.total_entries--;
      } else {
        memo.push(user);
      }
      return memo;
    }, [], this);
  },

  totalCount: function () {
    return this.total_user_entries;
  }
});
