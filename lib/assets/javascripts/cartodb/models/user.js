/* global _, cdb */

/**
 * the user has some base layers saved
 */
cdb.admin.UserLayers = cdb.admin.Layers.extend({
  url: function (method) {
    var version = cdb.config.urlVersion('layer', method);
    return '/api/' + version + '/users/' + this.user.id + '/layers';
  },

  custom: function () {
    return this.where({ category: undefined });
  }
});

cdb.admin.User = cdb.core.Model.extend({

  urlRoot: '/api/v1/users',

  defaults: {
    avatar_url: 'http://cartodb.s3.amazonaws.com/static/public_dashboard_default_avatar.png',
    username: ''
  },

  initialize: function (attrs) {
    attrs = attrs || {};
    this.tables = [];
    // Removing avatar_url attribute if it comes as null
    // Due to a Backbone Model constructor uses _.extends
    // instead of _.defaults
    if (this.get('avatar_url') === null) {
      this.set('avatar_url', this.defaults.avatar_url);
    }

    if (this.get('get_layers')) {
      this.layers = new cdb.admin.UserLayers();
      this.layers.user = this;
      this._fetchLayers();
    }

    this.email = (typeof attrs.email !== 'undefined') ? attrs.email : '';

    if (this.get('organization')) {
      this.organization = new cdb.admin.Organization(
        this.get('organization'),
        {
          currentUserId: this.id
        }
      );
    }

    this.groups = new cdb.admin.UserGroups(attrs.groups, {
      organization: _.result(this.collection, 'organization') || this.organization
    });
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

  _fetchLayers: function () {
    this.layers.fetch({ add: true });
  },

  fetchTables: function () {
    var self = this;

    if (this._fetchingTables) return;

    var tables = new cdb.admin.Visualizations();

    tables.options.set('type', 'table');
    tables.bind('reset', function () {
      self.tables = tables.map(function (u) { return u.get('name'); });
    });

    this._fetchingTables = true;

    tables.fetch();
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

  hasOwnTwitterCredentials: function () {
   var twitter = this.get('twitter');
   return (twitter && twitter.customized_config) || false;
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

  isEnterprise: function () {
    return this.get('account_type').toLowerCase().indexOf('enterprise') != -1;
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

  equals: function (otherUser) {
    if (otherUser.get) {
      return this.get('id') === otherUser.get('id');
    }
  },

  viewUrl: function () {
    return new cdb.common.UserUrl({
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

  usedQuotaPercentage: function () {
    return (this.get('db_size_in_bytes') * 100) / this.organization.get('available_quota_for_user');
  },

  assignedQuotaInRoundedMb: function () {
    return Math.floor(this.get('quota_in_bytes') / 1024 / 1024).toFixed(0);
  },

  assignedQuotaPercentage: function () {
    return (this.get('quota_in_bytes') * 100) / this.organization.get('available_quota_for_user');
  }

});
