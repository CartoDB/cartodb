const _ = require('underscore');
const Backbone = require('backbone');
const UserModel = require('dashboard/data/user-model');

// helper to manage organization users
module.exports = Backbone.Collection.extend({
  sync: require('dashboard/data/backbone/sync-abort'),
  model: UserModel,
  _DEFAULT_EXCLUDE_CURRENT_USER: true,

  url: function () {
    return '/api/v1/organization/' + this.organization.id + '/users';
  },

  initialize: function (models, opts) {
    if (!opts.organization) {
      throw new Error('Organization is needed for fetching organization users');
    }
    this.organization = opts.organization;

    this.currentUserId = opts.currentUserId;
    this._excludeCurrentUser = this._DEFAULT_EXCLUDE_CURRENT_USER;
  },

  comparator: function (mdl) {
    return mdl.get('username');
  },

  excludeCurrentUser: function (exclude) {
    exclude = !!exclude;
    this._excludeCurrentUser = exclude;
    if (exclude && !this.currentUserId) {
      console.error('set excludeCurrentUser to true, but there is no current user id set to exclude!');
    }
  },

  restoreExcludeCurrentUser: function () {
    this.excludeCurrentUser(this._DEFAULT_EXCLUDE_CURRENT_USER);
  },

  parse: function (r) {
    this.total_entries = r.total_entries;
    this.total_user_entries = r.total_user_entries;

    return _.reduce(r.users, function (memo, user) {
      if (this._excludeCurrentUser && user.id === this.currentUserId) {
        this.total_user_entries--;
        this.total_entries--;
      } else {
        memo.push(user);
      }
      return memo;
    }, [], this);
  },

  // @return {Number, undefined} may be undefined until a first fetch is done
  totalCount: function () {
    return this.total_user_entries;
  }
});
