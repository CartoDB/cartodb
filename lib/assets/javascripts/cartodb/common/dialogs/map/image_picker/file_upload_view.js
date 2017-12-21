var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var UploadModel = require('./upload_model');

module.exports = cdb.core.View.extend({

  className: 'AssetPane',

  options: {
    type: 'url',
    acceptSync: false,
    fileEnabled: true,
    formTemplate: '',
    headerTemplate: '',
    fileAttrs: {}
  },

  events: {
    'keyup .js-textInput': '_onTextChanged',
    'submit .js-form': '_onSubmitForm'
  },

  initialize: function() {

    this.user = this.options.user;
    this.kind = this.options.kind;

    this.collection = this.options.collection;

    this._setupModel();

    this.template = cdb.templates.getTemplate('common/dialogs/map/image_picker/file_upload_template');

  },

  render: function() {
    this.$el.html(
      this.template(_.extend(this.options, this.model.attributes))
    );

    this._initViews();
    return this;
  },

  _setupModel: function() {
    this.model = new UploadModel({
      type: this.options.type,
      kind: this.options.kind
    }, {
      userId: this.user.get("id")
    });
    this._initBinds();
  },

  _initBinds: function() {
    this.model.bind('change:state', this._onChangeState, this);
  },

  _initViews: function() {
    if (this.options.fileEnabled) {
      var self = this;
      this.$('.js-fileInput').bind('change', function(e) {
        if (this.files && this.files.length > 0) {
          self._onFileChanged(this.files);
        }
      });

      this._initDropzone();
    }
  },

  _onTextChanged: function() {
    var value = this.$('.js-textInput').val();
    if (!value) {
      this._hideTextError();
    }
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
      state: 'idle'
    });

    this.model.upload();

    if (this.model.get('state') !== "error") {
      // Remove errors
      this._hideFileError();
      this._hideTextError();
    } else {
      this._showTextError();
    }
  },


  _initDropzone: function() {
    var el = $('html')[0]; // :(
    var self = this;

    this.dragster = new Dragster(el);

    $(el).bind("dragster:enter", function (e) {
      self._showDropzone();
    });

    $(el).bind("dragster:leave", function (e) {
      self._hideDropzone();
    });

    if (el.dropzone) { // avoid loading the dropzone twice
      return;
    }

    this.dropzone = new Dropzone(el, {
      url: ':)',
      autoProcessQueue: false,
      previewsContainer: false
    });

    this.dropzone.on('dragover', function() {
      self._showDropzone();
    });

    this.dropzone.on("drop", function (ev) {
      var files = ev.dataTransfer.files;
      self._onFileChanged(files);
      self._hideDropzone();
    });
  },

  _destroyDropzone: function() {
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

  _setValidFileExtensions: function(list) {
    return RegExp("(\.|\/)(" + list.join('|') + ")$", "i");
  },

  _onFileChanged: function(files) {

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
      this.model.upload();
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

  _showDropzone: function() {
    this.$('.Form-upload').addClass('is-dropping');
    this._hideFileError();
  },

  _hideDropzone: function() {
    this.$('.Form-upload').removeClass('is-dropping');
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

  _onStateUploaded: function() {
    this.collection.fetch();
    this.model.setFresh({ kind: this.kind });
    this.$(".js-textInput").val("");
  },

  _onStateError: function() {
    this._showFileError();
    this.$(".js-form").show();
    this.trigger("hide_loader", this);
    this.model.setFresh({ kind: this.kind });
  },

  _onChangeState: function() {
    var state = this.model.get('state');

    if (state === 'uploaded') {
      this._onStateUploaded();
    } else {
      if (state === "error") {
        this._onStateError();
      } else if (state === 'idle' || state === "uploading" || state === "selected") {
        this.$(".js-form").hide();
        this.trigger("show_loader", this);
      } else {
        this.$(".js-form").show();
        this.trigger("hide_loader", this);
      }
    }
  },

  clean: function() {
    this._destroyDropzone();
    this.$('.js-fileInput').unbind('change');
    this.elder('clean');
  }

});
