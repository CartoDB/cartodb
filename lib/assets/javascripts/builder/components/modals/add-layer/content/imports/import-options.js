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
 *  visible: function that returns whether the service is visible
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

const IMPORT_OPTIONS = {

  // File: {
  //   view: ImportDataView,
  //   visible: function (config, userModel) { return true; },
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
    visible: function (config, userModel) { return !!config.get('oauth_gdrive'); },
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
  Dropbox: {
    view: ImportServiceView,
    visible: function (config, userModel) { return !!config.get('oauth_dropbox'); },
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
    visible: function (config, userModel) { return !!config.get('oauth_box'); },
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
    visible: function (_, userModel) { return userModel.get('twitter').enabled; },
    name: 'twitter',
    title: 'Twitter',
    type: 'other'
  },
  Mailchimp: {
    view: ImportServiceView,
    visible: function (config, userModel) { return userModel.get('mailchimp').enabled && !!config.get('oauth_mailchimp'); },
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
    visible: function (config, userModel) { return config.get('arcgis_enabled'); },
    name: 'arcgis',
    title: 'ArcGIS',
    type: 'other'
  },
  Salesforce: {
    view: ImportDataView,
    visible: function (config, userModel) { return config.get('salesforce_enabled'); },
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
  Hive: {
    view: ImportDataView,
    visible: function (config, userModel) { return config.get('hive_enabled'); },
    name: 'hive',
    title: 'Hive',
    type: 'database'
  },
  BigQuery: {
    view: ImportBigQueryView,
    visible: function (config, userModel) {
      const authModel = new BigQueryAuthModel({ configModel: config });
      return authModel.hasAnyAuthMethod();
    },
    name: 'bigquery',
    title: 'BigQuery',
    type: 'database',
    options: {
      type: 'service',
      service: 'bigquery',
      beta: false
    }
  },
  PostgreSQL: {
    view: ImportDatabaseView,
    visible: function (config, userModel) { return true; },
    name: 'postgresql',
    title: 'PostgreSQL',
    type: 'database',
    options: {
      service: 'postgres',
      params: [
        { key: 'server', type: 'text' },
        { key: 'port', type: 'number' },
        { key: 'database', type: 'text' },
        { key: 'username', type: 'text' },
        { key: 'password', type: 'password' }
      ],
      placeholder_query: 'SELECT ST_GeogPoint(longitude, latitude) AS the_geom, * FROM table'
    }
  },
  MySQL: {
    view: ImportDatabaseView,
    visible: function (config, userModel) { return true; },
    name: 'mysql',
    title: 'MySQL',
    type: 'database',
    options: {
      service: 'mysql',
      params: [
        { key: 'server', type: 'text' },
        { key: 'port', type: 'number' },
        { key: 'database', type: 'text' },
        { key: 'username', type: 'text' },
        { key: 'password', type: 'password' }
      ],
      placeholder_query: 'SELECT ST_AsWKT(ST_SRID(Point(lng, lat), 4326)) AS the_geom, field2, field3 from table'
    }
  },
  SQLServer: {
    view: ImportDatabaseView,
    visible: function (config, userModel) { return true; },
    name: 'sqlserver',
    title: 'SQL Server',
    type: 'database',
    options: {
      service: 'sqlserver',
      params: [
        { key: 'server', type: 'text' },
        { key: 'port', type: 'number' },
        { key: 'database', type: 'text' },
        { key: 'username', type: 'text' },
        { key: 'password', type: 'password' }
      ],
      placeholder_query: 'SELECT CONVERT(VARCHAR(MAX), geography::Point(lat, lng, 4326).STAsBinary(), 2) AS the_geom, field2, field3 from table'
    }
  },
  Snowflake: {
    view: ImportDatabaseView,
    visible: function (config, userModel) { return true; },
    name: 'snowflake',
    title: 'Snowflake',
    type: 'database',
    options: {
      service: 'snowflake',
      beta: true,
      params: [
        { key: 'server', type: 'text' },
        { key: 'database', type: 'text' },
        { key: 'username', type: 'text' },
        { key: 'password', type: 'password' },
        { key: 'warehouse', type: 'text', optional: true }
      ],
      placeholder_query: 'SELECT ST_MAKEPOINT(lng, lat) AS the_geom, * FROM table',
      sql_hint: 'To import GEOGRAPHY type data as the CARTO geometry you need to give it a `the_geom` alias, unless it already has an accepted name (the_geom, geom, geometry, geojson, wkt or wkb_geometry).'
    }
  },
  Redshift: {
    view: ImportDatabaseView,
    visible: function (config, userModel) { return true; },
    name: 'redshift',
    title: 'Redshift',
    type: 'database',
    options: {
      service: 'redshift',
      beta: true,
      params: [
        { key: 'cluster', type: 'text' },
        { key: 'port', type: 'number' },
        { key: 'database', type: 'text' },
        { key: 'username', type: 'text' },
        { key: 'password', type: 'password' }
      ],
      placeholder_query: 'SELECT ST_MakePoint(lng, lat) AS the_geom, * FROM table'
    }
  },
  DataObservatory: {
    view: null,
    visible: function (config, userModel) { return userModel.get('do_enabled'); },
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

const IMPORT_OPTIONS_ORDER = [
  'DataObservatory',

  // Cloud Storage
  'GDrive',
  'Box',
  'Dropbox',

  // Database
  'BigQuery',
  'Snowflake',
  'Redshift',
  'MySQL',
  'PostgreSQL',
  'SQLServer',
  // 'Hive',

  // Other
  'Arcgis',
  'Salesforce',
  'Twitter',
  'Mailchimp'
];

module.exports = { IMPORT_OPTIONS, IMPORT_OPTIONS_ORDER };
