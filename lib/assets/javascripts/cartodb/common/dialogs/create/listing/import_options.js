var ImportService = require('./imports/service_import/import_service_view');
var ImportTwitter = require('./imports/twitter_import/import_twitter_view');
var ImportDataView = require('./imports/import_data_view');
var ImportArcGISView = require('./imports/import_arcgis_view');

/**
 * Attributes:
 *
 *  ClassName: import pane class view
 *  enabled: function that takes cdb.config and returns whether the service is enabled
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
  File: {
    ClassName: ImportDataView,
    enabled: function (config, userData) { return true; },
    name: 'file',
    title: 'Data file',
    options: {
      type: 'url',
      fileEnabled: true,
      acceptSync: true
    }
  },
  GDrive: {
    ClassName: ImportService,
    enabled: function (config, userData) { return !!config.get('oauth_gdrive'); },
    name: 'gdrive',
    title: 'Google Drive',
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
    ClassName: ImportService,
    enabled: function (config, userData) { return !!config.get('oauth_dropbox'); },
    name: 'dropbox',
    title: 'Dropbox',
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
    ClassName: ImportService,
    enabled: function (config, userData) { return !!config.get('oauth_box'); },
    name: 'box',
    title: 'Box',
    fallback: 'common/views/create/listing/import_box_fallback',
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
    ClassName: ImportTwitter,
    enabled: function (config, userData) {
      return userData.get('twitter').enabled && !!config.get('datasource_search_twitter');
    },
    fallback: 'common/views/create/listing/import_twitter_fallback',
    name: 'twitter',
    title: 'Twitter'
  },
  Mailchimp: {
    ClassName: ImportService,
    enabled: function (config, userData) {
      return userData.get('mailchimp').enabled && !!config.get('oauth_mailchimp');
    },
    fallback: 'common/views/create/listing/import_mailchimp_fallback',
    name: 'mailchimp',
    title: 'MailChimp',
    options: {
      service: 'mailchimp',
      fileExtensions: [],
      acceptSync: true,
      showAvailableFormats: false,
      headerTemplate: 'common/views/create/listing/import_types/data_header_mailchimp',
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
  //   ClassName: ImportService,
  //   fallback: 'common/views/create/listing/import_instagram_fallback',
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
    ClassName: ImportArcGISView,
    enabled: function (config, userData) { return config.get('arcgis_enabled'); },
    fallback: 'common/views/create/listing/import_arcgis_fallback',
    name: 'arcgis',
    title: 'ArcGIS Server&trade;'
  },
  Salesforce: {
    ClassName: ImportDataView,
    enabled: function (config, userData) { return config.get('salesforce_enabled'); },
    fallback: 'common/views/create/listing/import_salesforce_fallback',
    name: 'salesforce',
    title: 'Salesforce'
    // options: {
    //   type: 'service',
    //   service_name: 'salesforce',
    //   acceptSync: true,
    //   formTemplate: 'common/views/create/listing/import_types/data_form_salesforce',
    //   headerTemplate: 'common/views/create/listing/import_types/data_header_salesforce'
    // }
  }
};
