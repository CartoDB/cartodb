var cdb = require('cartodb.js');
var MapUrl = require('./user/map_model');

/**
 * URL representing an normal User.
 */
module.exports = cdb.core.Model.extend({

  toAccountSettings: function() {
    return this._toStrExlSubdomain('account', this.get('user').get('username'));
  },

  // TODO: email do not belong here, was only put here while refactoring old code
  toUpgradeContactMail: function() {
    return 'support@cartodb.com';
  },

  toUpgradeAccount: function() {
    // Special case, the upgrade URL is set somewhere on the window obj
    var url = window.upgrade_url;
    if (!!url && url.length > 0) {
      return url;
    }
  },

  toPublicProfile: function() {
    return this.toStr();
  },

  toApiKeys: function() {
    return this.toStr('your_apps');
  },

  toLogout: function() {
    return this.toStr('logout');
  },

  mapUrl: function(vis) {
    if (this.get('user').equals(vis.permission.owner)) {
      return new MapUrl({
        userUrl: this,
        vis: vis
      });
    } else {
      // Vis is owned by other user, so return the appropriate user URL to point to the correct location:
      return this.get('mapUrlForVisOwnerFn')(vis);
    }
  },

  toStr: function() {
    return this._joinArgumentsWithSlashes(this._baseUrl(true), Array.prototype.slice.call(arguments, 0));
  },

  /**
   * @returns {string|*}
   * @protected
   */
  _joinArgumentsWithSlashes: function() {
    return _.chain(arguments).flatten().compact().value().join('/');
  },

  /**
   * @returns {string}
   * @protected
   */
  _protocolWithTrailingSlashes: function() {
    return window.location.protocol + '//';
  },

  /**
   * The baseUrl part for this user (w/o protocol).
   * @param inclSubdomain {Boolean}
   * @returns {string} e.g. 'https://username.hostname.ext'
   * @private
   */
  _baseUrl: function(includeSubdomain) {
    var str = this._protocolWithTrailingSlashes();
    if (includeSubdomain) {
      str += this.get('user').get('username') +'.';
    }
    return str + this.get('account_host');
  },

  /**
   * @returns {*}
   * @private
   */
  _toStrExlSubdomain: function() {
    return this._joinArgumentsWithSlashes(this._baseUrl(false), Array.prototype.slice.call(arguments, 0));
  }
});
