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
    }
  },

  url: function (method) {
    var version = this._configModel.urlVersion('connectors');
    var baseUrl = this._configModel.get('base_url');
    var apiKey = this._configModel.get('api_key');
    return baseUrl + '/api/' + version + '/connectors/?api_key' + apiKey;
  },

  initialize: function (attrs, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  _checkImportStatus: function (opts) {
    // Check if import option function exists
    var fn = this['_check' + opts.title.replace(' ', '') + 'Import'];
    var status = 'enabled';
    if (fn) {
      status = fn.apply(this, []);
    }
    return status;
  },

  _checkGoogleDriveImport: function () {
    if (!this._configModel.get('oauth_gdrive')) {
      return 'disabled';
    }
    return 'enabled';
  },

  _checkDropboxImport: function () {
    if (!this._configModel.get('oauth_dropbox')) {
      return 'disabled';
    }
    return 'enabled';
  },

  _checkBoxImport: function () {
    if (!this._configModel.get('oauth_box')) {
      return 'disabled';
    }
    return 'enabled';
  },

  _checkTwitterImport: function () {
    if (!this._configModel.get('datasource_search_twitter') ||
        !this._userModel.get('twitter').enabled ||
        !this._userModel.canCreateTwitterDataset()) {
      return 'disabled';
    }
    return 'enabled';
  },

  _checkInstagramImport: function () {
    if (!this._userModel.featureEnabled('instagram_import')) {
      return 'disabled';
    }
    if (!this._configModel.get('oauth_instagram')) {
      return 'disabled';
    }
    return 'enabled';
  },

  _checkSalesforceImport: function () {
    // Connector is now disabled for everyone.
    // You might be able to use the following check to determine
    // if user/org has this connector enabled:
    // this._userModel.get('salesforce').enabled
    return 'disabled';
  },

  _checkMailchimpImport: function () {
    if (!this._configModel.get('oauth_mailchimp')) {
      return 'disabled';
    }

    if (!this._userModel.featureEnabled('mailchimp_import')) {
      return 'disabled';
    }
    return 'enabled';
  },

  _checkPostgreSQLImport: function () {
    return 'disabled';
    // return this.get('postgres').enabled ? 'enabled' : 'disabled';
  },

  _checkMySQLImport: function () {
    return 'disabled';
    // return this.get('mysql').enabled ? 'enabled' : 'disabled';
  },

  _checkSQLServerImport: function () {
    return 'disabled';
    // return this.get('sqlserver').enabled ? 'enabled' : 'disabled';
  },

  _checkHiveImport: function () {
    return 'disabled';
    // return this.get('hive').enabled ? 'enabled' : 'disabled';
  },

  _checkBigQueryImport: function () {
    return this.get('bigquery').enabled ? 'enabled' : 'beta';
  }
});
