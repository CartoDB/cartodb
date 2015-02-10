var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var Utils = require('cdb.Utils');
var ImportDefaultView = require('new_common/dialogs/create/listing/imports/import_default_view');
var UploadModel = require('new_dashboard/background_importer/upload_model');
var UploadConfig = require('new_common/upload_config');

/**
 *  Import url panel
 *
 *  - It accepts an url
 *  - It checks if it is valid
 *  - It could accept files if content is enabled
 *
 */


module.exports = ImportDefaultView.extend({

  events: {
    'click .js-back': '_moveBack',
    'submit .js-form': '_onFormSubmit'
  },

  className: 'ImportPanel ImportUrlPanel',

  initialize: function() {
    this.user = this.options.user;
    this.model = new UploadModel({
      type: 'url'
    });

    this.template = cdb.templates.getTemplate('new_common/views/create/listing/import_types/import_url');

    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.append(
      this.template({ extensions: '.' + UploadConfig.fileExtensions.join(',.') })
    );
    this._initViews();
    return this;
  },

  _initViews: function() {
    var self = this;

    // Import header
    // Import file
    this.$('.Form-file').bind('change', function(){
      self._onFilesSelected(this.files);
    });

    // Import form
    // Import selected

    
  },

  _initBinds: function() {
    this.model.bind('change:state', this._onStateChange, this);
  },

  _isValidURL: function(str) {
    return Utils.isURL(str)
  },

  _onFormSubmit: function(e) {
    if (e) this.killEvent(e);
    var value = this.$('.js-input').val();

    if (this._isValidURL(value)) {
      this.model.set({
        value: value,
        state: 'selected'
      });
    } else {
      console.log("TODO: error state");
    }
  },

  _onFilesSelected: function(files) {
    if (files && files.length === 1) {
      this.model.set({
        type: 'file',
        value: files
      });
    }
  },

  _moveBack: function() {
    this.model.set('state', 'idle');
  },

  _onStateChange: function(m, state, c) {
    // Show proper state
    var pos = this.$('.ImportPanel-state.is-' + state).position();
    if (pos && pos.left) {
      var current_margin = (this.$('.ImportPanel-bodyWrapper').css('margin-left')).replace(/px/g,'');
      this.$('.ImportPanel-bodyWrapper').css('margin-left', current_margin - pos.left + 'px');  
    }

    // Toggle back button
    this.$('.ImportPanel-headerButton')[ state === "selected" ? 'addClass' : 'removeClass']('is-active');
  }

})