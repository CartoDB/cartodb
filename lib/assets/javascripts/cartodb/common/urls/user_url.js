/**
 * URLs associated with a particular user.
 */
cdb.common.UserUrl = cdb.common.Url.extend({

  initialize: function (attrs) {
    if (_.isUndefined(attrs.is_org_admin)) {
      throw new Error('is_org_admin is required')
    }
  },

  organization: function() {
    if (this.get('is_org_admin')) {
      return this.toPath('organization');
    } else {
      return this.toPath('account');
    }
  },

  accountSettings: function() {
    return this.toPath('account');
  },

  publicProfile: function() {
    return this.toPath('maps');
  },

  apiKeys: function() {
    return this.toPath('your_apps');
  },

  logout: function() {
    return this.toPath('logout');
  },

});
