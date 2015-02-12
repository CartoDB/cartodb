var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var Utils = require('cdb.Utils');
var ImportDefaultView = require('new_common/dialogs/create/listing/imports/import_default_view');
var UploadModel = require('new_dashboard/background_importer/upload_model');
var UploadConfig = require('new_common/upload_config');
// var FormView = require('new_common/dialogs/create/listing/imports/url_import/');

/**
 *  Import url panel
 *
 *  - It accepts an url
 *  - It checks if it is valid
 *
 */

module.exports = ImportDefaultView.extend({

  options: {
    fileExtensions: [],
    acceptSync: true
  },

  className: 'ImportPanel ImportUrlPanel',

  initialize: function() {
    this.user = this.options.user;
    this.model = new UploadModel({
      type: 'url'
    }, {
      user: this.user
    });

    this.template = cdb.templates.getTemplate('new_common/views/create/listing/import_types/import_url');

    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(this.template());
    this._initViews();
    return this;
  },

  _initViews: function() {
    var self = this;

    // Import header
    // Import form
    // var formView = new FormView({

    // });
    // this.addView(formView);
    // Import selected
  },

  _initBinds: function() {
    this.model.bind('change:state', this._onStateChange, this);
  },

  _onStateChange: function(m, state, c) {
    this.$('.ImportPanel-state').hide();
    this.$('.ImportPanel-state.is-' + state).show();
  }

})