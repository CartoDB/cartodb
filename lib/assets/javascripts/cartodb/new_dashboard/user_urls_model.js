var cdb = require('cartodb.js');

/**
 * Model encapsulating links related to an User (used in the user settings dropdown for now).
 *
 * Expected to be created with an object like:
 *   {
 *     config: {cdb.config} Config variable.
 *     upgrade_url: {string} (Optional) The full URL to where user can find information to upgrade the account.
 *   }
 */
module.exports = cdb.core.Model.extend({
  initialize: function(attrs, opts) {
    this.config = opts.config;
  },

  upgradeUrl: function() {
    return this.get('upgrade_url');
  },

  hasUpgradeUrl: function() {
    var url = this.upgradeUrl();
    return !!url && url.length > 0;
  },

  publicProfileUrl: function(user) {
    if (user.isInsideOrg()) {
      return this.config.prefixUrl();
    } else {
      return this._protocol() + user.get('username') +'.'+ this.config.get('account_host');
    }
  },

  apiKeysUrl: function() {
    return this.config.prefixUrl() +'/your_apps';
  },

  contactUrl: function(user) {
    if (user.isInsideOrg() && !user.isOrgAdmin()) {
      return user.organization.owner.get('email');
    } else if (user.isOrgAdmin()) {
      return 'enterprise-support@cartodb.com';
    } else {
      return 'support@cartodb.com';
    }
  },

  accountSettingsUrl: function(user) {
    if (user.isOrgAdmin()) {
      return this.config.prefixUrl() +'/organization';
    } else {
      if (user.isInsideOrg()) {
        return this.config.prefixUrl() +'/organization/users/'+ user.get('username') +'/edit';
      } else {
        return this._protocol() + this.config.get('account_host') +'/account/'+ user.get('username');
      }
    }
  },

  logoutUrl: function() {
    return this.config.prefixUrl() +'/logout';
  },

  _protocol: function() {
    return window.location.protocol + '//';
  }
});
