var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var _ = require('underscore');
var UploadModel = require('../../../background_importer/upload_model');
var FormView = require('../../create/listing/imports/data_import/data_form_view');

module.exports = cdb.core.View.extend({

  className: 'AssetPane',

  options: {
    fileExtensions: ['PNG', 'JPG', 'SVG'],
    type: 'url',
    service: '',
    acceptSync: false,
    fileEnabled: true,
    formTemplate: '',
    headerTemplate: '',
    fileAttrs: {}
  },

  initialize: function() {

    this.user = this.options.user;
    this.kind = this.options.kind;

    this.collection = this.options.collection;

    this.template = cdb.templates.getTemplate('common/dialogs/map/image_picker/file_upload_template');

  },

  render: function() {

    // clean old views
    this.clearSubViews();

    this.$el.html(this.template());
    var $content = this.$content = this.$el;

    this.init_assets();

    this.model = new UploadModel({
      type: this.options.type,
      service_name: this.options.service
    }, {
      user: this.user
    });

    // Data Form
    var formView = new FormView({
      el: this.$('.ImportPanel-form'),
      user: this.user,
      model: this.model,
      template: 'common/dialogs/map/image_picker/data_upload_template',
      acceptFileTypes: this.options.fileExtensions,
      fileEnabled: this.options.fileEnabled
    });

   formView.render();
    this.addView(formView);

    return this;
  },

    init_assets: function() {
      this.collection.bind('add remove reset',  this._onAssetsFetched,  this);
      this.collection.bind('change',            this._checkOKButton,    this);
    },

    _onAssetsFetched: function() {
      this.$('.dialog-content > div.assets').remove();
      this.$('div.uploader, a.ok').show();
    }

});
