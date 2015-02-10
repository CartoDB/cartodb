var CreateScratch = require('new_common/dialogs/create/listing/imports/create_scratch_view')
var ImportFileView = require('new_common/dialogs/create/listing/imports/import_default_view'); 
var ImportUrlView = require('new_common/dialogs/create/listing/imports/import_url_view');
var ImportArcGISFallback = require('new_common/dialogs/create/listing/imports/import_arcgis_fallback_view');

/**
 * Attributes: 
 *
 *  className: import pane class view
 *  fallbackClassName: ...
 *  name: local name
 *  title: text for tab link
 *
 */

module.exports = {
  // File: {
  //   className: ImportUrlView,
  //   name: 'file',
  //   title: 'Data file'
  // },
  // GDrive:   {
  //   className: ImportFileView,
  //   name: 'gdrive',
  //   title: 'Google Drive'
  // },
  // Dropbox: {
  //   className: ImportFileView,
  //   name: 'dropbox',
  //   title: 'Dropbox'
  // },
  // Twitter: {
  //   className: ImportFileView,
  //   // fallbackClassName: {},
  //   name: 'twitter',
  //   title: 'Twitter'
  // },
  Scratch: {
    className: CreateScratch,
    name: 'scratch',
    title: 'Empty dataset'
  },
  // Instagram: {
  //   className: ImportFileView,
  //   // fallbackClassName: {},
  //   name: 'instagram',
  //   title: 'Instagram'
  // },
  // Arcgis: {
  //   className: ImportFileView,
  //   fallbackClassName: ImportArcGISFallback,
  //   name: 'arcgis',
  //   title: 'ArcGIS online'
  // },
  // Salesforce: {
  //   className: ImportFileView,
  //   // fallbackClassName: {},
  //   name: 'salesforce',
  //   title: 'SalesForce'
  // },
  // Mailchimp: {
  //   className: ImportFileView,
  //   // fallbackClassName: {},
  //   name: 'mailchimp',
  //   title: 'MailChimp'
  // }
};