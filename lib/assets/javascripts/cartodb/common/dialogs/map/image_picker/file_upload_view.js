var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var _ = require('underscore');

module.exports = cdb.core.View.extend({

  className: 'AssetPane',

  _TEXTS: {
  },

  _UPLOADER: {
    url:              '/api/v1/users/<%- id %>/assets',
    uploads:          1, // Max uploads at the same time
    maxFileSize:      1048576, // 1MB
    acceptFileTypes:  ['png','svg','jpeg','jpg'],
    acceptSync:       undefined,
    resolution:       "1024x1024"
  },

  events: {
  },

  initialize: function() {

    _.bindAll(this, "_onUploadStart", "_onUploadAbort", "_onUploadAdd", "_onUploadComplete", "_onUploadError");

    this.user = this.options.user;
    this.kind = this.options.kind;

    this.model = new cdb.core.Model({ state: 'idle' });
    this.model.bind('change:state', this._checkOKButton, this);

    this.collection = this.options.collection;

    this.createModel = this.options.model;
    this.template = cdb.templates.getTemplate('new_common/dialogs/map/image_picker/file_upload_template');

  },

  render: function() {

    // clean old views
    this.clearSubViews();

    this.$el.html(this.template());
    var $content = this.$content = this.$el;

    // Init uploader
    this._init_uploader($content);
    this.init_assets($content);

    this.filePane = new cdb.admin.ImportFilePane({
      template: cdb.templates.getTemplate('table/views/asset_manager/import_asset_file'),
      maxFileSize: this._UPLOADER.maxFileSize,
      maxUploadFiles: this._UPLOADER.uploads,
      acceptFileTypes: this._UPLOADER.acceptFileTypes,
      acceptSync: this._UPLOADER.acceptSync,
      resolution: this._UPLOADER.resolution
    });

    this.filePane.bind('fileChosen', this._uploadData, this);
    this.filePane.bind('valueChange', this._checkOKButton, this);

    this.$el.append(this.filePane.$el);

    return this;
  },

    init_assets: function() {
      this.collection.bind('add remove reset',  this._onAssetsFetched,  this);
      this.collection.bind('change',            this._checkOKButton,    this);
      this.collection.fetch();
    },

    _onAssetsFetched: function() {
      // Enable or disable uploaded images pane
      var items = this.collection.where({ kind: this.kind }).length;
      if (items === 0) {
        //this.upload_tabs.disable('assets');
        //this.upload_panes.removeTab('assets');
        //this.upload_panes.active( this.kind === "marker" ? 'simpleicon' : 'file' );
      } else {
        //this.upload_tabs.enable('assets');
        //if (!this.upload_panes.getPane('assets')) {
          //this.upload_panes.addTab('assets', this.assetsPane);
        //}
        //this.upload_panes.active('assets');
      }

      // Hide loader
      this.$('.dialog-content > div.assets').remove();
      // Show content
      this.$('div.uploader, a.ok').show();
    },

    //////////////
    // UPLOADER //
    //////////////

    _init_uploader: function($content) {
      // Create all components vars
      this.$loader      = $content.find("div.upload-progress");
      this.$list        = $content.find("div.dialog-content");
      this.$import      = $content.find("div.upload");
      this.$error       = this.$("section.modal.error");
      this.$importation = this.$("section.modal:eq(0)");

      // Create the fileupload
      var $upload = this.$upload = $content.find("form.dialog-uploader");
      $upload.fileupload({
        // It is not possible to disable dropzone.
        // So, dropzone element doesn't exist, :)
        dropZone:               this.$('.non-dropzone'),
        url:                    _.template(cdb.config.prefixUrl() + this._UPLOADER.url)(this.user),
        paramName:              'filename',
        progressInterval:       100,
        bitrateInterval:        500,
        maxFileSize:            this._UPLOADER.maxFileSize,
        autoUpload:             true,
        limitMultiFileUploads:  this._UPLOADER.uploads,
        limitConcurrentUploads: this._UPLOADER.uploads,
        acceptFileTypes:        this._setValidFileExtensions(this._UPLOADER.acceptFileTypes),
        add:                    this._onUploadAdd,
        start:                  this._onUploadStart,
        done:                   this._onUploadComplete,
        fail:                   this._onUploadError,
        // set the type of the asset
        formData: { kind: this.kind }
      });

      // Set uploader widget
      this.uploader = this.$upload.data('fileupload');

      return this.$content;
    },

    _setValidFileExtensions: function(list) {
      return RegExp("(\.|\/)(" + list.join('|') + ")$", "i");
    },

    _uploadData: function(file) {
      if (file.type === "file") {
        this.$upload.fileupload('add', {files: file.value});
      } else {
        this._uploadFromUrl(file);
      }
    },

    _uploadFromUrl: function(obj) {
      // Validate file url if it comes from a service, like Dropbox.
      if (obj.type != 'url') {
        var file = { name: obj.value };
        // Validate this url file
        this.uploader._validate( [file] );
        
        if (file.error) {
          // Show error
          this._onUploadError(null, { files: [file] });
          return false;
        }
      }

      // Active file pane
      //this.upload_panes.active('file');
      // Change the state of the ui
      this._changeState("uploading");
      // Change state of the dialog
      this.model.set('state', 'uploading');

      // upload via ajax
      // TODO: change this by a save on a model
      var self = this;
      $.ajax({
        type: "POST",
        url: _.template(cdb.config.prefixUrl() + this._UPLOADER.url)(this.user),
        data: { url: obj.value, kind: this.kind },
        success: function(r) {
          self._onUploadComplete();
        },
        error: function(e) {
          var file = { error: 'connection', name: obj.value };
          self._onUploadError(null, { jqXHR: e, files: [ file ] });
        }
      });
    },

      // When an upload starsts
    _onUploadStart: function(e, data) {
      this.model.set('state', 'uploading');
      this._changeState("uploading");
    },

    // If user cancels an upload
    _onUploadAbort: function(e) {
      this.model.set('state', 'idle');
      if (e) e.preventDefault();
      this.jqXHR.abort();
    },

    // Upload complete, YAY!
    _onUploadComplete: function() {
      this.model.set('state', 'idle');
      this.collection.fetch();
      // clean file pane
      //this.filePane.cleanInput();
      this._changeState("reset");
    },

    // When a file is added, start the upload
    _onUploadAdd: function(e, data) {
      if (data.originalFiles.length == 1) {
        this.jqXHR = data.submit();
      }
    },

    // On upload error
    _onUploadError: function(e, data) {
      this.model.set('state', 'idle');
      this._changeState("reset");

      this._changeState('reset');

      if (this.filePane) {
        // Activate file tab
        //this.upload_panes.active('file');

        var resolutionError = data.jqXHR && data.jqXHR.responseText && data.jqXHR.responseText.search("file is too big") != -1;
        if (resolutionError) data.errorThrown = "resolution";

        // Connectivity error?
        if (data.errorThrown == "Bad Request") {
          data.files[0].error = 'connection';
        }

        // Resolution error?
        if (data.errorThrown == "resolution") {
          data.files[0].error = 'resolution';
        }        

        // Abort error?
        if (data.errorThrown == "abort") {
          data.files[0].error = 'abort';
        }

        // Show error in file tab
        this.filePane._onUploadError(null, {
          files: data.files
        });        
      }
    },

    _checkOKButton: function() {
      this.trigger("fileChosen", this);
    },

    // Show loader
    _showLoader: function() {
      this.$loader.addClass("active");
    },

    // Hide loader
    _hideLoader: function() {
      this.$loader.removeClass("active creating uploading");
    },

  
    // Change ui state
    _changeState: function(mode) {
      var actions = cdb.admin.upload_asset_states[mode];

      if (mode == "uploading") {
        this.$el.find(".import-pane").fadeOut(250);
      }

      // Hide close?
      //this.$importation.find("a.close").stop()[actions.hideClose ? "fadeOut" : "fadeIn"]();

      // List animation
      //this.$list.stop().animate(actions.list.animate.properties,actions.list.animate.options);

      // Loader animation and setting up
      var pos = this.$list.position();

      if (actions.loader.progress) {
        this.$loader.find("span").width(actions.loader.progress + "%");
        this.$loader.find("p").text(actions.loader.text)
      }

      actions.loader.animate.properties.top = _.template(String(actions.loader.animate.properties.top), {top: 10 });

      if (mode == "reset") {
        actions.loader.animate.properties.top = actions.loader.animate.properties.top - 20;
      }

      this.$loader
      .removeClass(actions.loader.removeClasses)
      .addClass(actions.loader.addClasses)
      .css(actions.loader.css)
      .stop()
      .animate(
        actions.loader.animate.properties,
        actions.loader.animate.options
      );

      if (mode == 'reset') {
        this.$el.find(".import-pane").fadeIn(250);
      }

      // Show stop
      if (actions.stop) {
        this.$loader.find("a.stop").show();
      } else {
        this.$loader.find("a.stop").hide();
      }

      // Show loader?
      if (actions.showLoader) {
        this._showLoader();
      } else {
        this._hideLoader();
      }
    }

});
