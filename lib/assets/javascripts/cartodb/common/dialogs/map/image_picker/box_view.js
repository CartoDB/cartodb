var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var UploadModel = require('./upload_model');

module.exports = cdb.core.View.extend({

  className: 'AssetPane',

  events: {
    'click .js-fileButton': '_onBoxClick'
  },

  _UPLOADER: {
    url:              '/api/v1/users/<%- id %>/assets',
    uploads:          1, // Max uploads at the same time
    maxFileSize:      1048576, // 1MB
    acceptFileTypes:  ['png','svg','jpeg','jpg'],
    acceptSync:       undefined,
    resolution:       "1024x1024"
  },

  initialize: function() {
    _.bindAll(this, '_onDbxChooserSuccess');

    this.kind = this.options.kind;
    this.user = this.options.user;
    this._setupModel();
    this.collection = this.options.collection;
  },

  render: function() {
    this.clearSubViews();

    this.template = cdb.templates.getTemplate('common/dialogs/map/image_picker/box_template');

    this.$el.html(this.template());

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

  _onStateUploaded: function() {
    this.collection.fetch();
    this.model.setFresh({ kind: this.kind });
  },

  _onStateError: function() {
    this._showFileError();
    this.trigger("hide_loader", this);
    this.$(".js-import-panel").show();
    this.model.setFresh({ kind: this.kind });
  },

  _showFileError: function() {
    if (this.model.get('state') === "error") {
      this.$('.js-fileError')
        .text(this.model.get('get_error_text').what_about)
        .show();
      this.$('.js-fileButton').addClass('Button--negative');
    }
  },

  _hideFileError: function() {
    this.$('.js-fileError').hide();
    this.$('.js-fileLabel').show();
    this.$('.js-fileButton').removeClass('Button--negative');
  },

  _onChangeState: function() {
    var state = this.model.get('state');

    if (state === 'uploaded') {
      this._onStateUploaded();
    } else {
      if (state == "error") {
        this._onStateError();
      } else if (state === 'idle' || state === "uploading") {
        this.$(".js-import-panel").hide();
        this.trigger("show_loader", this);
      } else {
        this.$(".js-import-panel").show();
        this.trigger("hide_loader", this);
      }
    }
  },


  _onBoxClick: function(e) {
    this.killEvent(e);

    Box.choose({
      success:      this._onDbxChooserSuccess,
      multiselect:  false,
      linkType:     "direct",
      extensions:   _.map(this._UPLOADER.acceptFileTypes, function(ext) { return '.' + ext })
    });
  },

  _onDbxChooserSuccess: function(files) {
    if (files && files[0]) {
      this.model.set({
        type: 'url',
        value: files[0].link,
        state: 'uploading'
      });

      this.model.upload();

      if (this.model.get('state') !== "error") {
        // Remove errors
        this._hideFileError();
      } else {
        this._showFileError();
      }
    }
  }

});
