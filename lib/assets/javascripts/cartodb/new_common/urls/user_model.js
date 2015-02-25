var cdb = require('cartodb.js');
var MapUrl = require('./user/map_model');
var DatasetsUrl = require('./user/datasets_model');
var MapsUrl = require('./user/maps_model');
var _ = require('underscore');

/**
 * URL representing an normal User.
 */
module.exports = cdb.core.Model.extend({

  initialize: function (args) {
    if (!args.user) { throw new Error('user is required') }
    if (!args.account_host) { throw new Error('account_host is required') }
  },

  toAccountSettings: function() {
    return this._superadminHost() + '/account/' + this.get('user').get('username');
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
    return this._toStr();
  },

  toApiKeys: function() {
    return this._toStr('your_apps');
  },

  toLogout: function() {
    return this._toStr('logout');
  },

  toDashboard: function() {
    return this._toStr('dashboard');
  },

  mapUrl: function(vis) {
    if (vis.isOwnedByUser(this.get('user'))) {
      return new MapUrl({
        userUrl: this,
        vis: vis
      });
    } else {
      // Vis is owned by other user, so return the appropriate user URL to point to the correct location:
      return this.get('urls').mapUrl(vis);
    }
  },

  datasetsUrl: function() {
    return new DatasetsUrl({
      userUrl: this
    });
  },

  mapsUrl: function() {
    return new MapsUrl({
      userUrl: this
    });
  },

  host: function() {
    return this._protocolWithTrailingSlashes() + this._subdomain() + '.' + this.get('account_host');
  },

  rootPath: function() {
    return '';
  },

  /**
   * @protected
   */
  _toStr: function() {
    return this._joinArgumentsWithSlashes(
      this.host(),
      Array.prototype.slice.call(arguments, 0)
    );
  },

  /**
   * @protected
   */
  _subdomain: function() {
    return this.get('user').get('username');
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
   * @returns {string}
   * @protected
   */
  _superadminHost: function() {
    return this._protocolWithTrailingSlashes() + this.get('account_host');
  }
});
