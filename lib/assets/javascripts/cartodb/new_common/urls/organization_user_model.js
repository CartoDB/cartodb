var UserUrl = require('./user_model');

/**
 * Represents a organization user's URL.
 */
module.exports = UserUrl.extend({

  /**
   * @override user_model.toAccountSettings
   */
  toAccountSettings: function() {
    if (this.get('user').isOrgAdmin()) {
      return this._toStr('organization');
    } else {
      return this._toStr('organization/users', this.get('user').get('username'), 'edit');
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
    return this._toStr('your_apps');
  },

  toLogout: function() {
    return this._toStr('logout');
  },

  /**
   * @override user_model._toStr
   */
  _toStr: function() {
    return UserUrl.prototype._joinArgumentsWithSlashes.call(this,
      this.host(),
      this._rootPathWithoutLeadingSlash(),
      Array.prototype.slice.call(arguments, 0)
    );
  },

  rootPath: function() {
    return '/'+ this._rootPathWithoutLeadingSlash();
  },

  /**
   * @override user_model._subdomain
   */
  _subdomain: function() {
    return this.get('user').organization.get('name')
  },
  
  _rootPathWithoutLeadingSlash: function() {
    return 'u/' + this.get('user').get('username');
  }
});
