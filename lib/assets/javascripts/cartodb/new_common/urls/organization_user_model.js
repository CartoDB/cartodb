var UserUrl = require('./user_model');

/**
 * Represents a organization user's URL.
 */
module.exports = UserUrl.extend({

  /**
   * @override user_model.toAccountSettings
   */
  toAccountSettings: function() {
    var paths = [ 'organization' ];

    if (!this.get('user').isOrgAdmin()) {
      paths.push('users', this.get('user').get('username'), 'edit');
    }

    return this._toStrWithoutRootPath(paths);
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
    return this._toStrWithoutRootPath('your_apps');
  },

  toLogout: function() {
    return this._toStrWithoutRootPath('logout');
  },

  /**
   * @override user_model.toStr
   */
  toStr: function() {
    return this._toStrWithoutRootPath('u', this.get('user').get('username'));
  },

  _toStrWithoutRootPath: function() {
    return UserUrl.prototype._joinArgumentsWithSlashes.call(this, this._basePath(), Array.prototype.slice.call(arguments, 0));
  },

  _basePath: function() {
    return this._protocolWithTrailingSlashes() + this.get('user').organization.get('name') +'.'+ this.get('account_host');
  }
});
