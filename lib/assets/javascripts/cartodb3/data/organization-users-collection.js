var Backbone = require('backbone');
var _ = require('underscore');
var syncAbort = require('./backbone/sync-abort');
var UserModel = require('./user-model');

var DEFAULT_EXCLUDE_CURRENT_USER = true;

module.exports = Backbone.Collection.extend({
  model: function (attrs, opts) {
    var configModel = attrs.configModel;
    return new UserModel(_.omit(attrs, 'configModel'), {
      configModel: configModel
    });
  },

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

  fetch: function (opts) {
    this.trigger('fetching', this);
    opts.error = function (model, response) {
      this.trigger('error', this);
    }.bind(this);

    return Backbone.Collection.prototype.fetch.call(this, opts);
  },

  parse: function (r) {
    this.trigger('fetched', this);

    this.total_entries = r.total_entries;
    this.total_user_entries = r.total_user_entries;

    return _.reduce(r.users, function (memo, user) {
      if (this._excludeCurrentUser && user.id === this._currentUserId) {
        this.total_user_entries--;
        this.total_entries--;
      } else {
        user.configModel = this._configModel;
        memo.push(user);
      }
      return memo;
    }, [], this);
  },

  totalCount: function () {
    return this.total_user_entries;
  }
});
