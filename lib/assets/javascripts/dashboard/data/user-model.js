const _ = require('underscore');
const Backbone = require('backbone');
const UserUrlModel = require('dashboard/data/user-url-model');

const UserModel = Backbone.Model.extend({
  urlRoot: '/api/v1/users',

  defaults: {
    avatar_url: 'http://cartodb.s3.amazonaws.com/static/public_dashboard_default_avatar.png',
    username: ''
  },

  initialize: function (attrs, opts) {
    attrs = attrs || {};
    opts = opts || {};
    this.tables = [];
    // Removing avatar_url attribute if it comes as null
    // Due to a Backbone Model constructor uses _.extends
    // instead of _.defaults
    if (this.get('avatar_url') === null) {
      this.set('avatar_url', this.defaults.avatar_url);
    }

    this.email = (typeof attrs.email !== 'undefined') ? attrs.email : '';

    if (opts.groups) {
      this.setGroups(opts.groups);
    }

    if (opts.organization) {
      this.setOrganization(opts.organization);
    }
  },

  setGroups: function (groups) {
    this.groups = groups;
  },

  setOrganization: function (organization) {
    this.organization = organization;

    if (this.groups) {
      this.groups.organization = organization;
    }
  },

  isInsideOrg: function () {
    if (this.organization) {
      return this.organization.id !== false || this.isOrgOwner();
    }
    return false;
  },

  isAuthUsernamePasswordEnabled: function () {
    if (this.organization) {
      return this.organization.get('auth_username_password_enabled');
    }
    return false;
  },

  isOrgOwner: function () {
    if (this.organization) {
      return this.organization.owner.get('id') === this.get('id');
    }
    return false;
  },

  isOrgAdmin: function () {
    if (this.organization) {
      return this.organization.isOrgAdmin(this);
    }
    return false;
  },

  isViewer: function () {
    return this.get('viewer') === true;
  },

  isBuilder: function () {
    return !this.isViewer();
  },

  role: function () {
    return this.get('role_display');
  },

  isDOEnabled: function () {
    return this.get('do_enabled');
  },

  isEnterprise: function () {
    return this.get('is_enterprise');
  },

  isIndividualUser: function () {
    const proUsers = ['Individual', 'Annual Individual'];
    return proUsers.indexOf(this.get('account_type')) > -1;
  },

  isFree2020User: function () {
    return this.get('account_type').toLowerCase().indexOf('free 2020') !== -1;
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

  renderData: function (currentUser) {
    var name = this.get('username');

    if (currentUser && currentUser.id === this.id) {
      name = _t('You');
    }

    return {
      username: name,
      avatar_url: this.get('avatar_url')
    };
  },

  hasCreateDatasetsFeature: function () {
    return this.isBuilder();
  },

  canCreateDatasets: function () {
    if (!this.get('remaining_byte_quota') || this.get('remaining_byte_quota') <= 0) {
      return false;
    }

    return this.hasCreateDatasetsFeature();
  },

  hasCreateMapsFeature: function () {
    return this.isBuilder();
  },

  canAddLayerTo: function (map) {
    if (!map || !map.layers || !map.layers.getDataLayers) {
      throw new Error('Map model is not defined or wrong');
    }
    var dataLayers = map.layers.getDataLayers();
    return dataLayers.length < this.getMaxLayers();
  },

  getMaxLayers: function () {
    return (this.get('limits') && this.get('limits').max_layers) || 5;
  },

  hasPublicMapsLimits: function () {
    const userWithLimits = this.isIndividualUser() || this.isFree2020User();
    return userWithLimits && !this.hasUnlimitedPublicMaps();
  },

  hasRemainingPublicMaps: function () {
    if (this.hasPublicMapsLimits()) {
      return this.get('public_map_quota') > this.getTotalPublicMapsCount();
    }
    return true;
  },

  hasUnlimitedPublicMaps: function () {
    return this.get('public_map_quota') === null;
  },

  getTotalPublicMapsCount: function () {
    var totalPublicPrivacyMapsCount = this.get('public_privacy_map_count') || 0;
    var totalPasswordPrivacyMapsCount = this.get('password_privacy_map_count') || 0;
    var totalLinkPrivacyMapsCount = this.get('link_privacy_map_count') || 0;

    return totalPublicPrivacyMapsCount + totalPasswordPrivacyMapsCount + totalLinkPrivacyMapsCount;
  },

  hasPrivateMapsLimits: function () {
    const userWithLimits = this.isFree2020User();
    return userWithLimits && !this.hasUnlimitedPrivateMaps();
  },

  hasRemainingPrivateMaps: function () {
    if (this.hasPrivateMapsLimits()) {
      return this.get('private_map_quota') > this.getTotalPrivateMapsCount();
    }
    return true;
  },

  hasUnlimitedPrivateMaps: function () {
    return this.get('private_map_quota') === null;
  },

  getTotalPrivateMapsCount: function () {
    return this.get('private_privacy_map_count');
  },

  getMaxConcurrentImports: function () {
    return (this.get('limits') && this.get('limits').concurrent_imports) || 1;
  },

  featureEnabled: function (name) {
    var featureFlags = this.get('feature_flags');

    if (!featureFlags || featureFlags.length === 0 || !name) {
      return false;
    }

    return _.contains(featureFlags, name);
  },

  isCloseToLimits: function () {
    var quota = this.get('quota_in_bytes');
    var remainingQuota = this.get('remaining_byte_quota');

    return ((remainingQuota * 100) / quota) < 20;
  },

  getOrganizationName: function () {
    return this.isInsideOrg() ? this.organization.get('name') : '';
  },

  getOrgName: function () {
    return this.isInsideOrg() ? this.organization.get('name') : '';
  },

  getMaxLayersPerMap: function () {
    return this.get('max_layers') || 4;
  },

  canStartTrial: function () {
    return !this.isInsideOrg() && this.get('account_type') === 'FREE' && this.get('table_count') > 0;
  },

  canCreatePrivateDatasets: function () {
    var actions = this.get('actions');
    return actions && actions.private_tables;
  },

  canCreateTwitterDataset: function () {
    return this.hasOwnTwitterCredentials();
  },

  canSelectPremiumOptions: function (visModel) {
    return this.get('actions')[ visModel.isVisualization() ? 'private_maps' : 'private_tables' ];
  },

  hasOwnTwitterCredentials: function () {
    var twitter = this.get('twitter');
    return (twitter && twitter.customized_config) || false;
  },

  equals: function (otherUser) {
    if (otherUser.get) {
      return this.get('id') === otherUser.get('id');
    }
  },

  viewUrl: function () {
    return new UserUrlModel({
      base_url: this.get('base_url'),
      is_org_admin: this.isOrgAdmin()
    });
  },

  upgradeContactEmail: function () {
    if (this.isInsideOrg()) {
      if (this.isOrgOwner()) {
        return 'enterprise-support@carto.com';
      } else {
        return this.organization.owner.get('email');
      }
    } else {
      return 'support@carto.com';
    }
  },

  needsPasswordConfirmation: function () {
    return this.get('needs_password_confirmation');
  },

  usedQuotaPercentage: function () {
    return (this.get('db_size_in_bytes') * 100) / this.organization.get('available_quota_for_user');
  },

  assignedQuotaInRoundedMb: function () {
    return Math.floor(this.get('quota_in_bytes') / 1024 / 1024).toFixed(0);
  },

  assignedQuotaPercentage: function () {
    return (this.get('quota_in_bytes') * 100) / this.organization.get('available_quota_for_user');
  },

  getGoogleApiKey: function () {
    return this.get('google_maps_private_key');
  },

  hasGoogleMaps: function () {
    return !!this.getGoogleApiKey();
  },

  showGoogleApiKeys: function () {
    return this.hasGoogleMaps() && (!this.isInsideOrg() || this.isOrgOwner());
  },

  getSchema: function () {
    return this.isInsideOrg() ? this.get('username') : 'public';
  },

  getAuthToken: function () {
    return btoa(`${this.get('username')}:${this.get('api_key')}`);
  },

  getModelType: () => 'user',

  isActionEnabled: function (action) {
    return this.get('actions') && this.get('actions')[action];
  },

  hasAccountType: function (accountType) {
    return this.get('account_type') === accountType;
  },

  // Public sharing
  hasPublicMapSharingDisabled: function () {
    return this.get('public_map_quota') === 0;
  },

  hasPublicDatasetSharingDisabled: function () {
    return this.get('public_dataset_quota') === 0;
  }
});

module.exports = UserModel;
