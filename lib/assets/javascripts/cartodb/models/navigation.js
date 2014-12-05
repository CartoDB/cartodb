cdb.admin.Navigation = cdb.core.Model.extend({
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
      return this.config.prefixUrl() +'/u/' + user.get('username');
    } else {
      return window.location.protocol + '//'+ user.get('username') +'.'+ this.config.get('account_host');
    }
  },

  apiKeysUrl: function() {
    return this.config.prefixUrl() +'/your_apps';
  },

  accountSettingsUrl: function(user) {
    if (user.isOrgAdmin()) {
      return this.config.prefixUrl() +'/organization';
    } else {
      if (user.isInsideOrg()) {
        return this.config.prefixUrl() +'/organization/users/'+ user.get('username') +'/edit';
      } else {
        return this.config.get('account_host') +'/account/'+ user.get('username');
      }
    }
  },

  logoutUrl: function() {
    return this.config.prefixUrl() +'/logout';
  }
});
