var CreateScratch = require('new_common/dialogs/create/listing/imports/create_scratch_view');
var ImportService = require('new_common/dialogs/create/listing/imports/service_import/import_service_view');
var ImportFileView = require('new_common/dialogs/create/listing/imports/import_default_view'); 
var ImportUrlView = require('new_common/dialogs/create/listing/imports/import_url_view');

/**
 * Attributes: 
 *
 *  className: import pane class view
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
    className: ImportUrlView,
    name: 'file',
    title: 'Data file'
  },
  GDrive:   {
    className: ImportService,
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
    className: ImportService,
    name: 'dropbox',
    title: 'Dropbox',
    options: {
      service: 'dropbox',
      fileExtensions: ['CSV', 'XLS', 'KML', 'GPX'],
      showAvailableFormats: true,
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
  Twitter: {
    className: ImportFileView,
    fallback: 'new_common/views/create/listing/import_twitter_fallback',
    name: 'twitter',
    title: 'Twitter'
  },
  Scratch: {
    className: CreateScratch,
    name: 'scratch',
    title: 'Empty dataset'
  },
  Instagram: {
    className: ImportFileView,
    name: 'instagram',
    title: 'Instagram'
  },
  Arcgis: {
    className: ImportFileView,
    fallback: 'new_common/views/create/listing/import_arcgis_fallback',
    name: 'arcgis',
    title: 'ArcGIS online'
  },
  Salesforce: {
    className: ImportFileView,
    fallback: 'new_common/views/create/listing/import_salesforce_fallback',
    name: 'salesforce',
    title: 'SalesForce'
  },
  Mailchimp: {
    className: ImportService,
    fallback: 'new_common/views/create/listing/import_mailchimp_fallback',
    name: 'mailchimp',
    title: 'MailChimp',
    options: {
      service: 'mailchimp',
      fileExtensions: [],
      acceptSync: true,
      showAvailableFormats: false,
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
  }
};