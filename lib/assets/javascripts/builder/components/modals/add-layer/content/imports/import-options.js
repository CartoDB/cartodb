var ImportDataView = require('./import-data/import-data-view');
var ImportServiceView = require('./import-service/import-service-view');
var ImportArcGISView = require('./import-arcgis/import-arcgis-view');
var ImportTwitterView = require('./import-twitter/import-twitter-view');

var ImportBigQueryView = require('./import-bigquery/import-bigquery-view');
var BigQueryAuthModel = require('./import-bigquery/import-bigquery-auth-model');

var ImportDatabaseView = require('./import-database/import-database-view');

/**
 * Attributes:
 *
 *  view: import pane class view
 *  enabled: function that takes configModel and returns whether the service is enabled
 *  name: local name
 *  title: text for tab link
 *  type: defines in which group of connectors should appear. Posible values: cloud, database or other
 *  options:
 *    - service:
 *    - fileExtensions:
 *    - showAvailableFormats:
 *    - acceptSync:
 *    - fileAttrs:
 *    - beta: optional to tag the connector as beta
 *    - soon: optional to tag the connector as soon
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
    enabled: function (config, userModel) {
      const authModel = new BigQueryAuthModel({ configModel: config });
      return authModel.hasAnyAuthMethod();
    },
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
    enabled: function (_, userModel) { return userModel.get('twitter').enabled; },
    name: 'twitter',
    title: 'Twitter',
    type: 'other'
  },
  Mailchimp: {
    view: ImportServiceView,
    enabled: function (config, userModel) { return userModel.get('mailchimp').enabled && !!config.get('oauth_mailchimp'); },
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
    name: 'arcgis',
    title: 'ArcGIS Server&trade;',
    type: 'other'
  },
  Salesforce: {
    view: ImportDataView,
    enabled: function (config, userModel) { return config.get('salesforce_enabled'); },
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
    view: ImportDatabaseView,
    enabled: function (config, userModel) { return config.get('postgres_enabled'); },
    name: 'postgresql',
    title: 'PostgreSQL',
    type: 'database',
    options: {
      service: 'postgres'
    }
  },
  MySQL: {
    view: ImportDatabaseView,
    enabled: function (config, userModel) { return config.get('mysql_enabled'); },
    name: 'mysql',
    title: 'MySQL',
    type: 'database',
    options: {
      service: 'mysql'
    }
  },
  SQLServer: {
    view: ImportDatabaseView,
    enabled: function (config, userModel) { return config.get('sqlserver_enabled'); },
    name: 'sqlserver',
    title: 'SQL Server',
    type: 'database',
    options: {
      service: 'sqlserver'
    }
  },
  Hive: {
    view: ImportDataView,
    enabled: function (config, userModel) { return config.get('hive_enabled'); },
    name: 'hive',
    title: 'Hive',
    type: 'database'
  },
  DataObservatory: {
    view: null,
    enabled: function (config, userModel) { return true; /* return config.get('dataobservatory_enabled'); */ },
    name: 'dataobservatory',
    title: 'CARTO Data Observatory',
    type: 'dataobservatory',
    options: {
      new: true,
      highlighted: true,
      link: '/dashboard/datasets/spatial-data-catalog/'
    }
  }
};
