var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');

/**
 *  Form view for url import for example
 *
 *  - It accepts an url
 *  - It checks if it is valid
 *  - It could have a file option
 *
 */

module.exports = cdb.core.View.extend({

  options: {
    template: '',
    fileEnabled: false
  },

  events: {
    'keyup .js-textInput': '_onTextChanged',
    'submit .js-form': '_onSubmitForm'
  },

  initialize: function() {
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate(this.options.template || 'new_common/views/create/listing/import_types/data_form');
    this._initBinds();
    this._checkVisibility();
  },

  render: function() {
    this.$el.html(
      this.template(this.options)
    )
    this._initViews();
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:state', this._checkVisibility, this);
  },

  _initViews: function() {
    if (this.options.fileEnabled) {
      var self = this;
      this.$('.js-fileInput').bind('change', function(e) {
        if (this.files) {
          self._onFileChanged(this.files);
        }
      });
    }
  },

  _setValidFileExtensions: function(list) {
    return RegExp("(\.|\/)(" + list.join('|') + ")$", "i");
  },

  _onTextChanged: function() {
    var value = this.$('.js-textInput').val();
    if (!value) {
      this._hideTextError();
    }
  },

  _onFileChanged: function(files) {
    this.trigger('fileSelected', this);

    var files = files;

    if (files && files.length === 1) {
      files = files[0];
    }

    this.model.set({
      type: 'file',
      value: files
    });

    if (this.model.get('state') !== "error") {
      this._hideFileError();
      this.model.set('state', 'selected');
    } else {
      this._showFileError();
    }
  },

  _showTextError: function() {
    this.$('.Form-inputError').addClass('is-visible');
  },

  _hideTextError: function() {
    this.$('.Form-inputError').removeClass('is-visible');
  },

  _showFileError: function() {
    if (this.model.get('state') === "error") {
      this.$('.js-fileError')
        .text(this.model.get('get_error_text').what_about)
        .show();
      this.$('.js-fileLabel').hide();
      this.$('.js-fileButton').addClass('Button--negative');
    }
  },

  _hideFileError: function() {
    this.$('.js-fileError').hide();
    this.$('.js-fileLabel').show();
    this.$('.js-fileButton').removeClass('Button--negative');
  },

  _onSubmitForm: function(e) {
    if (e) this.killEvent(e);

    // URL submit
    var value = this.$('.js-textInput').val();

    if (!value) {
      this._hideTextError();
      return;
    }

    // Change file attributes :S
    this.trigger('urlSelected', this);

    // Change model
    this.model.set({
      type: 'url',
      value: value,
      service_item_id: value,
      state: 'idle'
    });

    if (this.model.get('state') !== "error") {
      // Remove errors
      this._hideFileError();
      this._hideTextError();
      this.model.set('state', 'selected');
    } else {
      this._showTextError();
    }
  },

  _checkVisibility: function() {
    var state = this.model.get('state');
    this[ state !== "selected" ? 'show' : 'hide' ]()
  },

  clean: function() {
    this.$('.js-fileInput').unbind('change');
    this.elder('clean');
  }

});
