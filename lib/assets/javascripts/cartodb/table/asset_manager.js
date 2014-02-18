
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
   */

  cdb.admin.AssetManager = cdb.admin.BaseDialog.extend({

    _TEXTS: {
      title:        _t('Select a {marker_kind} image'),
      ok:           _t('Set image'),
      upload: {
        error:      _t('There was a problem with the upload, please try it again.'),
        url_error:  _t('The url provided was not valid, please try another one.')
      }
    },

    _UPLOADER: {
      url:              '/api/v1/users/<%= id %>/assets',
      uploads:          1, // Max uploads at the same time
      maxFileSize:      1048576, // 1MB
      acceptFileTypes:  ['png','svg','jpeg','jpg'],
      acceptSync:       undefined
    },

    events: function(){
      return _.extend({},cdb.admin.BaseDialog.prototype.events,{ });
    },

    initialize: function() {
      _.bindAll(this, "_onUploadStart", "_onUploadAbort",
      "_onUploadAdd", "_onUploadComplete", "_onUploadError");

      this.model = new cdb.core.Model({ state: 'idle' });
      this.model.bind('change:state', this._onStateChange, this);
      this.user = this.options.user;
      this.kind = this.options.kind;
      if(!this.kind) {
        throw new Error('kind should be passed');
      }

      _.extend(this.options, {
        title: i18n.format(this._TEXTS.title, { marker_kind: this.kind }),
        description: '',
        template_name: 'common/views/dialog_base',
        clean_on_hide: true,
        ok_button_classes: "button grey disabled",
        cancel_button_classes: "hide",
        ok_title: this._TEXTS.ok,
        modal_type: "creation asset_manager",
        width: 600
      });

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

      // Create TabPane
      this.upload_panes = new cdb.ui.common.TabPane({
        el: $content.find(".upload-panes")
      });

      this.upload_panes.bind('tabEnabled', this._checkOKButton, this);
      this.addView(this.upload_panes);
      this.upload_tabs.linkToPanel(this.upload_panes);

      // Render file pane
      this._renderFilePane($content);

      // Render dropbox pane
      this._renderDropboxPane($content);

      $content.append(this.upload_panes.render());
      this.upload_panes.active('file');
    },


    _renderFilePane: function() {
      this.filePane = new cdb.admin.ImportFilePane({
        template: cdb.templates.getTemplate('table/views/asset_manager/import_asset_file'),
        maxFileSize: this._UPLOADER.maxFileSize,
        maxUploadFiles: this._UPLOADER.uploads,
        acceptFileTypes: this._UPLOADER.acceptFileTypes,
        acceptSync: this._UPLOADER.acceptSync
      });
      this.filePane.bind('fileChosen', this._uploadData, this);
      this.filePane.bind('valueChange', this._checkOKButton, this);

      this.upload_panes.addTab('file', this.filePane);
    },

    _renderDropboxPane: function($content) {
      if (cdb.config.get('dropbox_api_key')) {
        this.dropboxPane = new cdb.admin.ImportDropboxPane({
          template: cdb.templates.getTemplate('table/views/asset_manager/import_asset_dropbox'),
          acceptFileTypes: this._UPLOADER.acceptFileTypes,
          acceptSync: this._UPLOADER.acceptSync
        });
        this.dropboxPane.bind('valueChange', this._uploadData, this);
        this.upload_panes.addTab('dropbox', this.dropboxPane);  
      } else {
        $content.find('a.dropbox').parent().remove();
      }
    },

    _renderGDrivePane: function() {},


    ////////////
    // ASSETS //
    ////////////

    init_assets: function($content) {
      this.assets_collection = new cdb.admin.Assets([], {
        user: this.user
      });

      // Generate assets list
      var assets_list = new cdb.admin.AssetsList({
        collection: this.assets_collection,
        kind: this.kind
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
        this._selectLastAsset();
      } else {
        this.$('div.assets-list').hide();
        this.$('div.assets').css('marginBottom', 0);
      }

      this.$('div.assets div.loader').hide();
    },

    _selectLastAsset: function() {
      var last_kind_asset;

      this.assets_collection.each(function(asset) {
        if (asset.get('state') == "selected") {
          asset.set('state', 'idle');
        }
        if (asset.get('kind') == this.kind) {
          last_kind_asset = asset;
        }
      }, this);

      if (last_kind_asset) last_kind_asset.set('state', 'selected');
      this._checkOKButton();
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
        // It is not possible to disable dropzone.
        // So, dropzone element doesn't exist, :)
        dropZone:               this.$('.non-dropzone'),
        url:                    _.template(this._UPLOADER.url)(this.user),
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

    _onStateChange: function() {
      if (this._isEnabled()) {
        this.$('.ok').removeClass('disabled');
      } else {
        this.$('.ok').addClass('disabled');
      }
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
      this.upload_panes.active('file');
      // Change the state of the ui
      this._changeState("uploading");
      // Change state of the dialog
      this.model.set('state', 'uploading');

      // upload via ajax
      // TODO: change this by a save on a model
      var self = this;
      $.ajax({
        type: "POST",
        url: _.template(this._UPLOADER.url)(this.user),
        data: { url: obj.value, kind: this.kind },
        success: function(r) {
          self._onUploadComplete();
        },
        error: function(e) {
          var file = { error: 'connection', name: obj.value };
          self._onUploadError(null, { files: [ file ] });
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
      this.assets_collection.fetch();
      // clean file pane
      this.filePane.cleanInput();
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
        this.upload_panes.active('file');

        // Connectivity error?
        if (data.errorThrown == "Bad Request") {
          data.files[0].error = 'connection';
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




    //////////////////
    //  UI ACTIONS  //
    //////////////////

    // Check
    _checkOKButton: function() {
      var $ok = this.$("a.ok");
      var action = 'addClass';
      var pane = this.upload_panes.activePane;
      var url = pane.model.get('value');

      action = this._getSelectedAsset() ? 'removeClass' : 'addClass';

      $ok[action]('disabled')
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

      if (this.upload_panes.activeTab == 'file' && this.upload_panes.activePane.getURL()) {
        this.filePane.submitUpload();
      } else if (this._isEnabled()) {
        // If it is enabled to get an asset, go for it!
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
