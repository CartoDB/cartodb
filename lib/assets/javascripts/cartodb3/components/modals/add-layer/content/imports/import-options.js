var cdb = require('cartodb-deep-insights.js');
var ImportDataView = require('./import-data/import-data-view');
var ImportServiceView = require('./import-service/import-service-view');
var ImportArcGISView = require('./import-arcgis/import-arcgis-view');
// var ImportTwitterView = require('./imports/twitter_import/import_twitter_view');

/**
 * Attributes:
 *
 *  view: import pane class view
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
    view: ImportDataView,
    name: 'file',
    title: 'Data file',
    options: {
      type: 'url',
      fileEnabled: true,
      acceptSync: true
    }
  },
  GDrive: {
    view: ImportServiceView,
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
    view: ImportServiceView,
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
    view: ImportServiceView,
    name: 'box',
    title: 'Box',
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
  // Twitter: {
  //   view: cdb.core.View,
  //   fallback: require('./fallbacks/import-twitter-fallback.tpl'),
  //   name: 'twitter',
  //   title: 'Twitter'
  // },
  Mailchimp: {
    view: ImportServiceView,
    fallback: require('./fallbacks/import-mailchimp-fallback.tpl'),
    name: 'mailchimp',
    title: 'MailChimp',
    options: {
      service: 'mailchimp',
      fileExtensions: [],
      acceptSync: true,
      showAvailableFormats: false,
      headerTemplate: 'common/views/create/listing/import_types/data_header_mailchimp.tpl',
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
  Instagram: {
    view: cdb.core.View,
    fallback: require('./fallbacks/import-instagram-fallback.tpl'),
    name: 'instagram',
    title: 'Instagram',
    options: {
      service: 'instagram',
      fileExtensions: [],
      acceptSync: false,
      showAvailableFormats: false,
      fileAttrs: {
        ext: false,
        title: 'title'
      }
    }
  },
  // Arcgis: {
  //   view: cdb.core.View,
  //   fallback: require('./fallbacks/import-arcgis-fallback.tpl'),
  //   name: 'arcgis',
  //   title: 'ArcGIS Server&trade;'
  // },
  Salesforce: {
    view: ImportDataView,
    fallback: require('./fallbacks/import-salesforce-fallback.tpl'),
    name: 'salesforce',
    title: 'SalesForce',
    options: {
      type: 'service',
      service_name: 'salesforce',
      acceptSync: true,
      formTemplate: require('./import-salesforce/import-data-form-salesforce.tpl'),
      headerTemplate: require('./import-salesforce/import-data-header-salesforce.tpl')
    }
  }
};
