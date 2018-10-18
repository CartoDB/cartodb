require('dragster');
var Dropzone = require('dropzone');
var $ = require('jquery');
var CoreView = require('backbone/core-view');
var template = require('./import-data-form.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');

/**
 *  Form view for url import for example
 *
 *  - It accepts an url
 *  - It checks if it is valid
 *  - It could have a file option
 *
 */

var REQUIRED_OPTS = [
  'userModel'
];

module.exports = CoreView.extend({
  options: {
    template: '',
    fileEnabled: false
  },

  events: {
    'keyup .js-textInput': '_onTextChanged',
    'submit .js-form': '_onSubmitForm'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this.template = opts.template || template;

    this._initBinds();
    this._checkVisibility();
  },

  render: function () {
    this.$el.html(
      this.template(this.options)
    );
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this.model.bind('change:state', this._checkVisibility, this);
  },

  _initViews: function () {
    if (this.options.fileEnabled) {
      var self = this;
      this.$('.js-fileInput').bind('change', function (e) {
        if (this.files && this.files.length > 0) {
          self._onFileChanged(this.files);
        }
        this.value = '';
      });

      this._initDropzone();
    }
  },

  _initDropzone: function () {
    var el = $('html')[0]; // :(
    var self = this;

    this.dragster = new Dragster(el); // eslint-disable-line

    $(el).bind('dragster:enter', function (e) {
      self._showDropzone();
    });

    $(el).bind('dragster:leave', function (e) {
      self._hideDropzone();
    });

    if (el.dropzone) { // avoid loading the dropzone twice
      el.dropzone.destroy();
    }

    this.dropzone = new Dropzone(el, {
      url: ':)',
      autoProcessQueue: false,
      previewsContainer: false
    });

    this.dropzone.on('dragover', function () {
      self._showDropzone();
    });

    this.dropzone.on('drop', function (ev) {
      var files = ev.dataTransfer.files;
      self._onFileChanged(files);
      self._hideDropzone();
    });
  },

  _destroyDropzone: function () {
    var el = $('html')[0]; // :(

    if (this.dragster) {
      this.dragster.removeListeners();
      this.dragster.reset();
      $(el).unbind('dragster:enter dragster:leave');
    }

    if (this.dropzone) {
      this.dropzone.destroy();
    }
  },

  _setValidFileExtensions: function (list) {
    return RegExp('(\.|\/)(' + list.join('|') + ')$', 'i');
  },

  _onTextChanged: function () {
    var value = this.$('.js-textInput').val();
    if (!value) {
      this._hideTextError();
    }
  },

  _onFileChanged: function (files) {
    this.trigger('fileSelected', this);

    if (files && files.length === 1) {
      files = files[0];
    }

    this.model.setUpload({
      type: 'file',
      value: files
    });

    if (this.model.get('state') !== 'error') {
      this._hideFileError();
      this.model.set('state', 'selected');
    } else {
      this._showFileError();
    }
  },

  _showTextError: function () {
    this.$('.Form-inputError').addClass('is-visible');
  },

  _hideTextError: function () {
    this.$('.Form-inputError').removeClass('is-visible');
  },

  _showDropzone: function () {
    this.$('.Form-upload').addClass('is-dropping');
    this._hideFileError();
  },

  _hideDropzone: function () {
    this.$('.Form-upload').removeClass('is-dropping');
  },

  _showFileError: function () {
    if (this.model.get('state') === 'error') {
      this.$('.js-fileError')
        .text(this.model.get('get_error_text').what_about)
        .show();
      this.$('.js-fileLabel').hide();
      this.$('.js-fileButton').addClass('Button--negative');
    }
  },

  _hideFileError: function () {
    this.$('.js-fileError').hide();
    this.$('.js-fileLabel').show();
    this.$('.js-fileButton').removeClass('Button--negative');
  },

  _onSubmitForm: function (e) {
    if (e) this.killEvent(e);

    var value = this.$('.js-textInput').val();

    if (!value) {
      this._hideTextError();
      return;
    }

    // Change file attributes :S
    this.trigger('urlSelected', this);

    // Change model
    var importType = this.model.get('service_name') ? 'service' : 'url';
    this.model.setUpload({
      type: importType,
      value: value,
      service_item_id: value,
      state: 'idle'
    });

    if (this.model.get('state') !== 'error') {
      this._hideFileError();
      this._hideTextError();
      this.model.set('state', 'selected');

      this.trigger('urlSubmitted', this);
    } else {
      this._showTextError();
    }
  },

  _checkVisibility: function () {
    var state = this.model.get('state');
    this[ state !== 'selected' ? 'show' : 'hide' ]();
  },

  clean: function () {
    this._destroyDropzone();
    this.$('.js-fileInput').unbind('change');
    CoreView.prototype.clean.apply(this);
  }
});
