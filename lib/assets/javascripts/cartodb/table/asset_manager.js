
  /**
   *  Asset manager to select & upload icons or patterns...
   *
   *  - It creates a model to manage the states of the dialog ('idle' or 'uploading')
   *  - It creates a assets collection to manage images.
   *  - It needs the user data, to get the id and use it in the collection.
   *  
   *  new cdb.admin.AssetManager({
   *    user: user_data
   *  });
   *
   *  TODO:
   *  - Check dropbox problem.
   *  - Change image preview.
   */

  cdb.admin.AssetManager = cdb.admin.BaseDialog.extend({

    _TEXTS: {
      title:        _t('Select a marker image'),
      ok:           _t('Set image'),
      upload: {
        error:      _t('There was a problem with the upload, please try it again.'),
        url_error:  _t('The url provided was not valid, please try another one.')
      }
    },

    _UPLOADER: {
      url:              '/api/v1/users/<%= id %>/assets',
      uploads:          1, // Max uploads at the same time
      maxFileSize:      1000000, // 1mb?
      acceptFileTypes:  /(\.|\/)(png|svg)$/i
    },

    events: function(){
      return _.extend({},cdb.admin.BaseDialog.prototype.events,{ });
    },

    initialize: function() {
      _.bindAll(this, "_onUploadStart", "_onUploadAbort",
      "_onUploadAdd", "_onUploadComplete", "_onUploadError");

      _.extend(this.options, {
        title: this._TEXTS.title,
        description: '',
        template_name: 'common/views/dialog_base',
        clean_on_hide: true,
        ok_button_classes: "button grey disabled",
        cancel_button_classes: "hide",
        ok_title: this._TEXTS.ok,
        modal_type: "creation asset_manager",
        width: 600
      });
      
      this.model = new cdb.core.Model({ state: 'idle' });
      this.model.bind('change:state', this._onStateChange, this);
      this.user = this.options.user;

      this.constructor.__super__.initialize.apply(this);      
    },

    ////////////
    // RENDER //
    ////////////

    render_content: function() {
      var $content = this.$content = $("<div>");
      this.temp_content = this.getTemplate('table/views/asset_manager/asset_manager');
      $content.append(this.temp_content());

      // Show marker images
      this.init_assets($content);

      // Render file tabs
      this.render_upload_tabs($content);

      // Init uploader
      this._init_uploader($content);

      return $content;
    },

    render_upload_tabs: function($content) {
      // Upload tabs
      this.upload_tabs = new cdb.admin.Tabs({
        el: $content.find('.upload-tabs'),
        slash: true
      });
      this.addView(this.upload_tabs);

      // File pane
      this.filePane = new cdb.admin.ImportFilePane({
        template: cdb.templates.getTemplate('table/views/asset_manager/import_asset_file'),
        maxFileSize: this._UPLOADER.maxFileSize,
        maxUploadFiles: this._UPLOADER.maxUploadFiles,
        acceptFileTypes: this._UPLOADER.acceptFileTypes,
        acceptFileTypesError: '{filename} has invalid extension. Only PNG, JPG, JPEG and SVG are allowed.'
      });
      this.filePane.bind('fileChosen', this._uploadData, this);

      // Dropbox
      this.dropboxPane = new cdb.admin.ImportDropboxPane({
        template: cdb.templates.getTemplate('table/views/asset_manager/import_asset_dropbox')
      });
      this.dropboxPane.bind('fileChosen', this._uploadData, this);

      // Create TabPane
      this.upload_panes = new cdb.ui.common.TabPane({
        el: $content.find(".upload-panes")
      });
      this.upload_panes.addTab('file', this.filePane);
      this.upload_panes.addTab('dropbox', this.dropboxPane);

      this.upload_tabs.linkToPanel(this.upload_panes);
      this.addView(this.upload_panes);
      $content.append(this.upload_panes.render());

      this.upload_panes.active('file');
    },


    ////////////
    // ASSETS //
    ////////////

    init_assets: function($content) {
      this.assets_collection = new cdb.admin.Assets([], {
        user: this.user
      });

      // Generate assets list
      var assets_list = new cdb.admin.AssetsList({
        collection: this.assets_collection
      });

      // Append content
      $content.find('.assets-list').append(assets_list.render().el);
      this.addView(assets_list);

      // Bind changes
      this.assets_collection.bind('add remove reset', this._onAssetsChange, this);
      this.assets_collection.bind('change',           this._onAssetChange, this);

      this.assets_collection.fetch();
    },

    // Bind changes when assets collection change
    _onAssetsChange: function() {
      if (this.assets_collection.size() > 0) {
        this.$('div.assets-list').show();
        this.$('div.assets').css('marginBottom', '30px');
      } else {
        this.$('div.assets-list').hide();
        this.$('div.assets').css('marginBottom', 0);
      }

      this.$('div.assets div.loader').hide();
    },

    // Bind when an asset is selected or not
    _onAssetChange: function() {
      // Check if any asset is selected
      var selected_asset = this._getSelectedAsset();

      if (selected_asset) {
        this.$('.ok').removeClass('disabled')
      } else {
        this.$('.ok').addClass('disabled')
      }
    },

    // Checks if an asset is selected
    _getSelectedAsset: function() {
      return this.assets_collection.find(function(m) {
        return m.get('state') == 'selected';
      });
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
        url:                    _.template(this._UPLOADER.url)(this.user),
        paramName:              'filename',
        progressInterval:       100,
        bitrateInterval:        500,
        maxFileSize:            this._UPLOADER.maxFileSize,
        autoUpload:             true,
        limitMultiFileUploads:  this._UPLOADER.maxUploadFiles,
        limitConcurrentUploads: this._UPLOADER.maxUploadFiles,
        add:                    this._onUploadAdd,
        start:                  this._onUploadStart,
        done:                   this._onUploadComplete,
        fail:                   this._onUploadError
      });

      return this.$content;
    },

    _onStateChange: function() {
      if (this._isEnabled()) {
        this.$('.ok').removeClass('disabled');
      } else {
        this.$('.ok').addClass('disabled');
      }
    },

    _uploadData: function(type, file) {
      if (type === "file") {
        this.$upload.fileupload('add', {files: file});
      } else {
        this._uploadFromUrl(file);
      }
    },

    _uploadFromUrl: function(url) {
      var self = this;

      // Active file pane
      this.upload_panes.active('file');

      // Change the state of the ui
      this._changeState("uploading");

      // Change state of the dialog
      this.model.set('state', 'uploading');

      // upload via ajax
      var self = this;
      $.ajax({
        type: "POST",
        url: _.template(this._UPLOADER.url)(this.user),
        data: { url: url },
        success: function(r) {
          self._onUploadComplete();
        },
        error: function(e) {
          self._onUploadError(self._TEXTS.upload.url_error);
        }
      });
    },

      // When an upload starsts
    _onUploadStart: function(ev,data) {
      this.model.set('state', 'uploading');
      this._changeState("uploading");
    },

    // If user cancels an upload
    _onUploadAbort: function(ev) {
      this.model.set('state', 'idle');
      if (ev) ev.preventDefault();
      this.jqXHR.abort();
    },

    // Upload complete, YAY!
    _onUploadComplete: function() {
      this.model.set('state', 'idle');
      this.assets_collection.fetch();
      // clean file pane
      this.filePane.cleanInput();
      this._changeState("reset");
    },

    // When a file is added, start the upload
    _onUploadAdd: function(ev,data) {
      if (data.originalFiles.length == 1) {
        this.jqXHR = data.submit();
      }
    },

    _onUploadError: function(msg) {
      this.model.set('state', 'idle');
      this._changeState("reset");
      this.upload_panes.active('file');
      this.filePane.showError( msg || this._TEXTS.upload.error );
    },




    //////////////////
    //  UI ACTIONS  //
    //////////////////

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

      // Hide close?
      this.$importation.find("a.close").stop()[actions.hideClose ? "fadeOut" : "fadeIn"]();

      // List animation
      this.$list.stop().animate(actions.list.animate.properties,actions.list.animate.options);

      // Loader animation and setting up
      var pos = this.$list.position();

      if (actions.loader.progress) {
        this.$loader.find("span").width(actions.loader.progress + "%");
        this.$loader.find("p").text(actions.loader.text)
      }

      actions.loader.animate.properties.top = _.template(String(actions.loader.animate.properties.top), {top: pos.top});

      if (mode == "reset")
        actions.loader.animate.properties.top = actions.loader.animate.properties.top - 20;

      this.$loader
        .removeClass(actions.loader.removeClasses)
        .addClass(actions.loader.addClasses)
        .css(actions.loader.css)
        .stop()
        .animate(
            actions.loader.animate.properties
          , actions.loader.animate.options
        )

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
    },

    _ok: function(e) {
      if (e) e.preventDefault();

      // If it is enabled to get an asset, go for it!
      if (this._isEnabled()) {
        var selected_asset = this._getSelectedAsset();
        this.trigger('fileChosen', selected_asset.get('public_url'));
        this.hide();
      }
      return false;
    },


    ////////////////////////
    //  HELPER FUNCTIONS  //
    ////////////////////////

    // Check if it is enable
    _isEnabled: function() {
      if (
        !this._getSelectedAsset() ||
        this.model.get('state') == "uploading") {
        return false;
      }
      return true;
    },

    // True cleanning
    clean: function() {
      // Destroy fileupload
      this.$upload.fileupload("destroy");
      this.$upload.unbind("mouseleave");

      // Remove keydown binding
      $(document).unbind('keydown', this._keydown);

      // Cancel upload in case there is one active
      if (this.jqXHR)
        this._onUploadAbort();

      cdb.ui.common.Dialog.prototype.clean.call(this);
    }

  });