var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var Utils = require('cdb.Utils');
var FormView = require('new_common/dialogs/create/listing/imports/data_import/data_form_view');
var HeaderView = require('new_common/dialogs/create/listing/imports/data_import/data_header_view');
var SelectedDataset = require('new_common/dialogs/create/listing/imports/import_arcgis_selected_dataset_view');
var ImportDataView = require('new_common/dialogs/create/listing/imports/import_data_view');

/**
 *  Import ArcGIS panel
 *
 *  - It only accepts an url, and it could be a map or a layer.
 *
 */

module.exports = ImportDataView.extend({

  options: {
    fileExtensions: [],
    type: 'url',
    service: 'arcgis',
    acceptSync: true,
    fileEnabled: false,
    fileAttrs: {
      ext: false,
      title: '',
      description: ''
    }
  }, 

  
  _initViews: function() {
    var self = this;

    // Data header
    var headerView = new HeaderView({
      el: this.$('.ImportPanel-header'),
      model: this.model,
      user: this.user,
      fileEnabled: this.options.fileEnabled,
      acceptSync: this.options.acceptSync,
      template: 'new_common/views/create/listing/import_types/data_header_arcgis'
    });
    headerView.render();
    this.addView(headerView);

    // Dataset selected
    var selected = new SelectedDataset({
      el: this.$('.DatasetSelected'),
      user: this.user,
      model: this.model,
      acceptSync: this.options.acceptSync,
      fileAttrs: this.options.fileAttrs,
      currentUserUrl: this.currentUserUrl
    });
    selected.render();
    this.addView(selected);

    // Data Form
    var formView = new FormView({
      el: this.$('.ImportPanel-form'),
      user: this.user,
      model: this.model,
      template: 'new_common/views/create/listing/import_types/data_form_arcgis',
      fileEnabled: this.options.fileEnabled
    });
    
    formView.render();
    this.addView(formView);
  
  }

})