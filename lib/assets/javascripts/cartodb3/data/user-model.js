var Backbone = require('backbone');
var _ = require('underscore');
var OrganizationModel = require('./organization-model');
var syncAbort = require('./backbone/sync-abort');

/**
 *  User model
 *
 */

var UserModel = Backbone.Model.extend({
  url: function () {
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/v1/users';
  },

  defaults: {
    avatar_url: 'http://cartodb.s3.amazonaws.com/static/public_dashboard_default_avatar.png',
    username: '',
    email: ''
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    this._configModel = opts.configModel;

    if (!_.isEmpty(this.get('organization'))) {
      this._organizationModel = new OrganizationModel(
        this.get('organization'),
        {
          configModel: this._configModel,
          currentUserId: this.id
        }
      );
    }
  },

  canCreateDatasets: function () {
    if (!this.get('remaining_byte_quota') || this.get('remaining_byte_quota') <= 0) {
      return false;
    }
    return true;
  },

  canCreateTwitterDataset: function () {
    return !((this.get('twitter').quota - this.get('twitter').monthly_use) <= 0 && this.get('twitter').hard_limit);
  },

  canStartTrial: function () {
    return !this.isInsideOrg() && this.get('account_type') === 'FREE' && this.get('table_count') > 0;
  },

  isActionEnabled: function (action) {
    return this.get('actions') && this.get('actions')[action];
  },

  canCreatePrivateDatasets: function () {
    var actions = this.get('actions');
    return actions && actions.private_tables;
  },

  isInsideOrg: function () {
    if (this._organizationModel) {
      return !!this._organizationModel.id || this.isOrgAdmin();
    }
    return false;
  },

  isOrgAdmin: function () {
    if (this._organizationModel) {
      return this._organizationModel.getOwnerId() === this.get('id');
    }
    return false;
  },

  featureEnabled: function (name) {
    var featureFlags = this.get('feature_flags');
    if (!featureFlags || featureFlags.length === 0 || !name) {
      return false;
    }
    return _.contains(featureFlags, name);
  },

  upgradeContactEmail: function () {
    if (this.isInsideOrg()) {
      if (this.isOrgAdmin()) {
        return 'enterprise-support@carto.com';
      } else {
        return this._organizationModel.getOwnerEmail();
      }
    } else {
      return 'support@carto.com';
    }
  },

  nameOrUsername: function () {
    return this.get('name') || this.get('username');
  },

  getMaxConcurrentImports: function () {
    return (this.get('limits') && this.get('limits').concurrent_imports) || 1;
  },

  renderData: function (currentUser) {
    var name = this.get('username');
    if (currentUser && currentUser.id === this.id) {
      name = _t('user.you');
    }
    return {
      username: name,
      avatar_url: this.get('avatar_url')
    };
  },

  clone: function () {
    var attrs = _.clone(this.attributes);
    delete attrs.id;
    return new UserModel(attrs, {
      configModel: this._configModel
    });
  }
});

// In order to bypass circular dependency in browserify
// we need to declare the UserCollection in the same module

var DEFAULT_EXCLUDE_CURRENT_USER = true;

var UserCollection = Backbone.Collection.extend({
  model: function (attrs, opts) {
    var configModel = attrs.configModel;
    return new UserModel(_.omit(attrs, 'configModel'), {
      configModel: configModel
    });
  },

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

exports.UserModel = UserModel;
exports.UserCollection = UserCollection;
