var Backbone = require('backbone');
var _ = require('underscore');
var syncAbort = require('./backbone/sync-abort');

var DEFAULT_EXCLUDE_CURRENT_USER = true;

module.exports = Backbone.Collection.extend({
  sync: syncAbort,

  url: function () {
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/v1/organization/' + this._organizationId + '/users';
  },

  initialize: function (models, opts) {
    if (!opts.organizationId) throw new Error('OrganizationId is required');
    if (!opts.currentUserId) throw new Error('currentUserId is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;
    this._organizationId = opts.organizationId;
    this._currentUserId = opts.currentUserId;

    this._excludeCurrentUser = DEFAULT_EXCLUDE_CURRENT_USER;
  },

  comparator: function (mdl) {
    return mdl.get('username');
  },

  excludeCurrentUser: function (exclude) {
    exclude = !!exclude;
    this._excludeCurrentUser = exclude;
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
