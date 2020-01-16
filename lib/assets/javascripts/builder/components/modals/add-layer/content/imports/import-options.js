var ImportDataView = require('./import-data/import-data-view');
var ImportServiceView = require('./import-service/import-service-view');
var ImportArcGISView = require('./import-arcgis/import-arcgis-view');
var ImportTwitterView = require('./import-twitter/import-twitter-view');
var ImportBigQueryView = require('./import-bigquery/import-bigquery-view');
var ImportDatabaseView = require('./import-database/import-database-view');

/**
 * Attributes:
 *
 *  view: import pane class view
 *  enabled: function that takes configModel and returns whether the service is enabled
 *  fallbackClassName: ...
 *  name: local name
 *  title: text for tab link
 *  options:
 *    - service:
 *    - fileExtensions:
 *    - showAvailableFormats:
 *    - acceptSync:
 *    - fileAttrs:
 *
 */

module.exports = {

  // File: {
  //   view: ImportDataView,
  //   enabled: function (config, userModel) { return true; },
  //   name: 'file',
  //   title: 'Data file',
  //   type: 'cloud',
  //   options: {
  //     type: 'url',
  //     fileEnabled: true,
  //     acceptSync: true
  //   }
  // },
  GDrive: {
    view: ImportServiceView,
    enabled: function (config, userModel) { return !!config.get('oauth_gdrive'); },
    name: 'gdrive',
    title: 'Google Drive',
    type: 'cloud',
    options: {
      service: 'gdrive',
      fileExtensions: ['Google SpreadSheet', 'CSV'],
      showAvailableFormats: false,
      acceptSync: true,
      fileAttrs: {
        ext: true,
        title: 'filename',
        description: {
          content: [{
            name: 'size',
            format: 'size',
            key: true
          }]
        }
      }
    }
  },
  BigQuery: {
    view: ImportBigQueryView,
    enabled: function (config, userModel) { return !!config.get('oauth_bigquery'); },
    fallback: require('./fallbacks/import-beta-fallback.tpl'),
    name: 'bigquery',
    title: 'BigQuery',
    type: 'database',
    options: {
      type: 'service',
      service: 'bigquery',
      beta: true
    }
  },
  Dropbox: {
    view: ImportServiceView,
    enabled: function (config, userModel) { return !!config.get('oauth_dropbox'); },
    name: 'dropbox',
    title: 'Dropbox',
    type: 'cloud',
    options: {
      service: 'dropbox',
      fileExtensions: ['CSV', 'XLS'],
      showAvailableFormats: false,
      acceptSync: true,
      fileAttrs: {
        ext: true,
        title: 'filename',
        description: {
          content: [
            {
              name: 'id',
              format: ''
            },
            {
              name: 'size',
              format: 'size',
              key: true
            }
          ],
          separator: '-'
        }
      }
    }
  },
  Box: {
    view: ImportServiceView,
    enabled: function (config, userModel) { return !!config.get('oauth_box'); },
    name: 'box',
    title: 'Box',
    type: 'cloud',
    fallback: require('./fallbacks/import-box-fallback.tpl'),
    options: {
      service: 'box',
      fileExtensions: ['CSV', 'XLS'],
      showAvailableFormats: false,
      acceptSync: true,
      fileAttrs: {
        ext: true,
        title: 'filename',
        description: {
          content: [
            {
              name: 'size',
              format: 'size',
              key: true
            }
          ],
          separator: '-'
        }
      }
    }
  },
  Twitter: {
    view: ImportTwitterView,
    enabled: function (config, userModel) { return userModel.get('twitter').enabled && !!config.get('datasource_search_twitter'); },
    fallback: require('./fallbacks/import-twitter-fallback.tpl'),
    name: 'twitter',
    title: 'Twitter'
  },
  Mailchimp: {
    view: ImportServiceView,
    enabled: function (config, userModel) { return userModel.get('mailchimp').enabled && !!config.get('oauth_mailchimp'); },
    fallback: require('./fallbacks/import-mailchimp-fallback.tpl'),
    name: 'mailchimp',
    title: 'MailChimp',
    options: {
      service: 'mailchimp',
      fileExtensions: [],
      acceptSync: true,
      showAvailableFormats: false,
      headerTemplate: require('./import-mailchimp/import-data-header-mailchimp.tpl'),
      fileAttrs: {
        ext: true,
        title: 'filename',
        description: {
          content: [{
            name: 'member_count',
            format: 'number',
            key: true
          }],
          itemName: 'member',
          separator: ''
        }
      }
    }
  },
  // Instagram: {
  //   view: ImportServiceView,
  //   fallback: require('./fallbacks/import-instagram-fallback.tpl'),
  //   name: 'instagram',
  //   title: 'Instagram',
  //   options: {
  //     service: 'instagram',
  //     fileExtensions: [],
  //     acceptSync: false,
  //     showAvailableFormats: false,
  //     fileAttrs: {
  //       ext: false,
  //       title: 'title'
  //     }
  //   }
  // },
  Arcgis: {
    view: ImportArcGISView,
    enabled: function (config, userModel) { return config.get('arcgis_enabled'); },
    fallback: require('./fallbacks/import-arcgis-fallback.tpl'),
    name: 'arcgis',
    title: 'ArcGIS Server&trade;',
    type: 'other'
  },
  Salesforce: {
    view: ImportDataView,
    enabled: function (config, userModel) { return config.get('salesforce_enabled'); },
    fallback: require('./fallbacks/import-salesforce-fallback.tpl'),
    name: 'salesforce',
    title: 'Salesforce'
    // options: {
    //   type: 'service',
    //   service_name: 'salesforce',
    //   acceptSync: true,
    //   formTemplate: require('./import-salesforce/import-data-form-salesforce.tpl'),
    //   headerTemplate: require('./import-salesforce/import-data-header-salesforce.tpl')
    // }
  },
  PostgreSQL: {
    view: ImportDataView,
    enabled: function (config, userModel) { return config.get('postgres_enabled'); },
    fallback: require('./fallbacks/import-notenabled-fallback.tpl'),
    name: 'postgresql',
    title: 'PostgreSQL',
    type: 'database'
  },
  MySQL: {
    view: ImportDataView,
    enabled: function (config, userModel) { return config.get('mysql_enabled'); },
    fallback: require('./fallbacks/import-notenabled-fallback.tpl'),
    name: 'mysql',
    title: 'MySQL',
    type: 'database'
  },
  SQLServer: {
    view: ImportDataView,
    enabled: function (config, userModel) { return config.get('sqlserver_enabled'); },
    fallback: require('./fallbacks/import-notenabled-fallback.tpl'),
    name: 'sqlserver',
    title: 'SQL Server',
    type: 'database'
  },
  Hive: {
    view: ImportDataView,
    enabled: function (config, userModel) { return config.get('hive_enabled'); },
    fallback: require('./fallbacks/import-notenabled-fallback.tpl'),
    name: 'hive',
    title: 'Hive',
    type: 'database'
  }
};
