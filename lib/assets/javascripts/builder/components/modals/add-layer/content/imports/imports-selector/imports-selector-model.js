var Backbone = require('backbone');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'userModel',
  'configModel'
];

/**
 * Imports selector model
 *
 * Knows the status of the connectors and
 * if they are available for the user or not.
 */

module.exports = Backbone.Model.extend({

  defaults: {
    'postgres': {
      'name': 'PostgreSQL',
      'description': null,
      'enabled': false
    },
    'mysql': {
      'name': 'MySQL',
      'description': null,
      'enabled': false
    },
    'sqlserver': {
      'name': 'Microsoft SQL Server',
      'description': null,
      'enabled': false
    },
    'hive': {
      'name': 'Hive',
      'description': null,
      'enabled': false
    },
    'bigquery': {
      'name': 'Google BigQuery',
      'description': null,
      'enabled': false
    },
    loaded: false
  },

  url: function (method) {
    var version = this._configModel.urlVersion('connectors');
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/' + version + '/connectors/';
  },

  initialize: function (attrs, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  _isImportEnabled: function (opts) {
    // Check if import option function exists
    var fn = this['_is' + opts.title.replace(' ', '') + 'ImportEnabled'];
    var enabled = true;
    if (fn) {
      enabled = fn.apply(this, []);
    }
    return enabled;
  },

  _isGoogleDriveImportEnabled: function () {
    if (!this._configModel.get('oauth_gdrive')) {
      return false;
    }
    return true;
  },

  _isDropboxImportEnabled: function () {
    if (!this._configModel.get('oauth_dropbox')) {
      return false;
    }
    return true;
  },

  _isBoxImportEnabled: function () {
    if (!this._configModel.get('oauth_box')) {
      return false;
    }
    return true;
  },

  _isTwitterImportEnabled: function () {
    if (!this._configModel.get('datasource_search_twitter') ||
        !this._userModel.get('twitter').enabled ||
        !this._userModel.canCreateTwitterDataset()) {
      return false;
    }
    return true;
  },

  _isInstagramImportEnabled: function () {
    if (!this._userModel.featureEnabled('instagram_import')) {
      return false;
    }
    if (!this._configModel.get('oauth_instagram')) {
      return false;
    }
    return true;
  },

  _isSalesforceImportEnabled: function () {
    // Connector is now disabled for everyone.
    // You might be able to use the following check to determine
    // if user/org has this connector enabled:
    // this._userModel.get('salesforce').enabled
    return false;
  },

  _isMailchimpImportEnabled: function () {
    if (!this._configModel.get('oauth_mailchimp')) {
      return false;
    }

    if (!this._userModel.featureEnabled('mailchimp_import')) {
      return false;
    }
    return true;
  },

  _isPostgreSQLImportEnabled: function () {
    return this.get('postgres').enabled;
  },

  _isMySQLImportEnabled: function () {
    return this.get('mysql').enabled;
  },

  _isSQLServerImportEnabled: function () {
    return this.get('sqlserver').enabled;
  },

  _isHiveImportEnabled: function () {
    return false;
    // return this.get('hive').enabled;
  },

  _isBigQueryImportEnabled: function () {
    return this.get('bigquery').enabled;
  }
});
