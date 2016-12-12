var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var ImportDefaultView = require('./import_default_view');
var UploadModel = require('../../../../background_polling/models/upload_model');
var FormView = require('./data_import/data_form_view');
var HeaderView = require('./data_import/data_header_view');
var SelectedDataset = require('./import_selected_dataset_view');

/**
 *  Import data panel
 *
 *  - It accepts an url
 *  - It checks if it is valid
 *
 */

module.exports = ImportDefaultView.extend({

  options: {
    fileExtensions: [],
    type: 'url',
    service: '',
    acceptSync: false,
    fileEnabled: false,
    formTemplate: '',
    headerTemplate: '',
    fileAttrs: {}
  },

  className: 'ImportPanel ImportDataPanel',

  initialize: function() {
    this.user = this.options.user;
    this.model = new UploadModel({
      type: this.options.type,
      service_name: this.options.service
    }, {
      user: this.user
    });

    this.template = cdb.templates.getTemplate('common/views/create/listing/import_types/import_data');

    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(this.template());
    this._initViews();
    return this;
  },

  _initViews: function() {
    // Data header
    var headerView = new HeaderView({
      el: this.$('.ImportPanel-header'),
      model: this.model,
      user: this.user,
      fileEnabled: this.options.fileEnabled,
      acceptSync: this.options.acceptSync,
      template: this.options.headerTemplate
    });
    headerView.render();
    this.addView(headerView);

    // Dataset selected
    var selected = new SelectedDataset({
      el: this.$('.DatasetSelected'),
      user: this.user,
      model: this.model,
      acceptSync: this.options.acceptSync,
      fileAttrs: this.options.fileAttrs
    });
    selected.render();
    this.addView(selected);

    // Data Form
    var formView = new FormView({
      el: this.$('.ImportPanel-form'),
      user: this.user,
      model: this.model,
      template: this.options.formTemplate,
      fileEnabled: this.options.fileEnabled
    });

    formView.bind('fileSelected', function() {
      selected.setOptions({
        acceptSync: false,
        fileAttrs: {
          ext: true,
          title: 'name',
          description: {
            content: [{
              name: 'size',
              format: 'size'
            }]
          }
        }
      });
    });

    formView.bind('urlSelected', function() {
      selected.setOptions({
        acceptSync: true,
        fileAttrs: {
          ext: false,
          title: '',
          description: ''
        }
      });
    });
    formView.render();
    this.addView(formView);

  },

  _initBinds: function() {
    this.model.bind('change:state', this._checkState, this);
    this.model.bind('change', this._triggerChange, this);
  },

  _checkState: function() {
    if (this.model.previous('state') === "selected") {
      this.model.set({
        type: undefined,
        value: '',
        service_name: '',
        service_item_id: '',
        interval: 0
      });
    }
  }

})
