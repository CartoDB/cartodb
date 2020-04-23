var _ = require('underscore');
var UrlModel = require('dashboard/data/url-model');
var DashboardUrlModel = require('dashboard/data/dashboard-url-model');
var OrganizationUrlModel = require('dashboard/data/organization-url-model');

/**
 * URLs associated with a particular user.
 */
var UserUrlModel = UrlModel.extend({
  initialize: function (attrs) {
    UrlModel.prototype.initialize.apply(this, arguments);

    if (_.isUndefined(attrs.is_org_admin)) {
      throw new Error('is_org_admin is required');
    }
  },

  organization: function () {
    if (this.get('is_org_admin')) {
      return new OrganizationUrlModel({
        base_url: this.urlToPath('organization')
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
    return new DashboardUrlModel({
      base_url: this.urlToPath('dashboard')
    });
  },

  connectedApps: function () {
    return new DashboardUrlModel({
      base_url: this.urlToPath('dashboard/app_permissions')
    });
  },

  connections: function () {
    return new DashboardUrlModel({
      base_url: this.urlToPath('dashboard/connections')
    });
  }
});

module.exports = UserUrlModel;
