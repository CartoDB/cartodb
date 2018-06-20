var Backbone = require('backbone');
var _ = require('underscore');
var OrganizationModel = require('./organization-model');
var UserGroups = require('./user-groups-collection');
var CustomBaselayersCollection = require('./custom-baselayers-collection');
/**
 *  User model
 *
 */

var UserModel = Backbone.Model.extend({
  urlRoot: function () {
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
    attrs = attrs || {};

    if (!_.isEmpty(this.get('organization'))) {
      this._organizationModel = new OrganizationModel(
        this.get('organization'),
        {
          configModel: this._configModel,
          currentUserId: this.id
        }
      );
    }

    if (this.get('layers')) {
      this.layers = new CustomBaselayersCollection(this.get('layers'), {
        configModel: this._configModel,
        currentUserId: this.id
      });
    }

    this.groups = new UserGroups(attrs.groups, {
      organization: this._organizationModel
    });
  },

  isViewer: function () {
    return this.get('viewer') === true;
  },

  isBuilder: function () {
    return !this.isViewer();
  },

  canCreateDatasets: function () {
    if (!this.get('remaining_byte_quota') || this.get('remaining_byte_quota') <= 0) {
      return false;
    }
    return true;
  },

  hasCreateMapsFeature: function () {
    return this.isBuilder();
  },

  canCreateTwitterDataset: function () {
    var twitter = this.get('twitter');
    return !(twitter.quota - twitter.monthly_use) <= 0 && twitter.hard_limit;
  },

  hasOwnTwitterCredentials: function () {
    var twitter = this.get('twitter');
    return (twitter && twitter.customized_config) || false;
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
      return !!this._organizationModel.id || this.isOrgOwner();
    }
    return false;
  },

  isOrgOwner: function () {
    if (this._organizationModel) {
      return this._organizationModel.getOwnerId() === this.get('id');
    }
    return false;
  },

  isOrgAdmin: function () {
    if (this._organizationModel) {
      return this._organizationModel.isOrgAdmin(this);
    }
    return false;
  },

  hasAccountType: function (accountType) {
    return this.get('account_type') === accountType;
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
      if (this.isOrgOwner()) {
        return 'enterprise-support@carto.com';
      } else {
        return this._organizationModel.getOwnerEmail();
      }
    } else {
      return 'support@carto.com';
    }
  },

  nameOrUsername: function () {
    return this.fullName() || this.get('username');
  },

  fullName: function () {
    var name = this.get('name') || '';
    var lastName = this.get('last_name') || '';
    if (name || lastName) {
      return name + (name && lastName ? ' ' : '') + lastName;
    }
    return '';
  },

  getMaxConcurrentImports: function () {
    return (this.get('limits') && this.get('limits').concurrent_imports) || 1;
  },

  getSchemaName: function () {
    return this.isInsideOrg() ? this.get('username') : 'public';
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
  },

  getOrganization: function () {
    return this._organizationModel;
  }
});

module.exports = UserModel;
