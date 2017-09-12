var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');

/**
 * URLs associated with a particular user.
 */
cdb.common.UserUrl = cdb.common.Url.extend({

  initialize: function (attrs) {
    cdb.common.Url.prototype.initialize.apply(this, arguments);

    if (_.isUndefined(attrs.is_org_admin)) {
      throw new Error('is_org_admin is required');
    }

    if (_.isUndefined(attrs.is_org_owner)) {
      throw new Error('is_org_owner is required');
    }
  },

  organization: function () {
    if (this.get('is_org_admin')) {
      return new cdb.common.OrganizationUrl({
        base_url: this.get('is_org_owner') ? this.urlToPath('organization/settings') : this.urlToPath('organization')
      });
    } else {
      return this.urlToPath('account');
    }
  },

  accountProfile: function () {
    return this.urlToPath('profile');
  },

  accountSettings: function () {
    return this.urlToPath('account');
  },

  publicProfile: function () {
    return this.urlToPath('me');
  },

  apiKeys: function () {
    return this.urlToPath('your_apps');
  },

  logout: function () {
    return this.urlToPath('logout');
  },

  dashboard: function () {
    return new cdb.common.DashboardUrl({
      base_url: this.urlToPath('dashboard')
    });
  }
});
