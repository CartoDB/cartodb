var cdb = require('cartodb.js');
var MapUrl = require('./user/map_model');
var DatasetsUrl = require('./user/datasets_model');
var MapsUrl = require('./user/maps_model');
var _ = require('underscore');

/**
 * URL representing an normal User.
 */
module.exports = cdb.core.Model.extend({

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

  toStr: function() {
    return this._joinArgumentsWithSlashes(
      this.host(),
      Array.prototype.slice.call(arguments, 0)
    );
  },

  /**
   * The host part for the URL.
   * @returns {string} e.g. 'https://username.hostname.ext'
   */
  host: function() {
    return this._protocolWithTrailingSlashes() + this._subdomain() +'.'+ this.get('account_host');
  },
  
  rootPath: function() {
    return '';
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
