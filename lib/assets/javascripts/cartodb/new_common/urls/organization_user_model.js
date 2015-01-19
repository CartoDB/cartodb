var UserUrl = require('./user_model');

/**
 * Represents a organization user's URL.
 */
module.exports = UserUrl.extend({

  /**
   * @override user_model.toAccountSettings
   */
  toAccountSettings: function() {
    var username = this.get('user').get('username');
    if (this.get('user').isOrgAdmin()) {
      return this._superadminHost() + '/account/'+ username;
    } else {
      return this.toStr('organization/users', username, 'edit');
    }
  },

  /**
   * @override user_model.toUpgradeContactMail
   * TODO: emails do not belong here, was only put here while refactoring old code
   */
  toUpgradeContactMail: function() {
    if (this.get('user').isOrgAdmin()) {
      return 'enterprise-support@cartodb.com';
    } else {
      return this.get('user').organization.owner.get('email');
    }
  },

  /**
   * @override user_model.toApiKeys
   */
  toApiKeys: function() {
    return this.toStr('your_apps');
  },

  toLogout: function() {
    return this.toStr('logout');
  },

  /**
   * @override user_model.toStr
   */
  toStr: function() {
    return UserUrl.prototype._joinArgumentsWithSlashes.call(this,
      this.host(),
      this._rootPathParts(),
      Array.prototype.slice.call(arguments, 0)
    );
  },

  /**
   * @override user_model._subdomain
   */
  _subdomain: function() {
    return this.get('user').organization.get('name')
  },
  
  _rootPathParts: function() {
    return [ 'u', this.get('user').get('username') ]
  }
});
