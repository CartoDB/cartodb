
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
      ok:           {
        assets:     _t('Set image'),
        makis:      _t('Set image'),
        file:       _t('Upload image'),
        dropbox:    _t('Upload image')
      },
      upload: {
        error:      _t('There was a problem with the upload, please try it again.'),
        url_error:  _t('The url provided was not valid, please try another one.')
      }
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
      _.bindAll(this, "_onUploadStart", "_onUploadAbort",
      "_onUploadAdd", "_onUploadComplete", "_onUploadError");

      this.model = new cdb.core.Model({ state: 'idle' });
      this.model.bind('change:state', this._checkOKButton, this);
      this.user = this.options.user;
      this.kind = this.options.kind;
      
      if(!this.kind) {
        throw new Error('kind should be passed');
      }

      this.collection = new cdb.admin.Assets([], {
        user: this.user
      });

      _.extend(this.options, {
        title: i18n.format(this._TEXTS.title, { marker_kind: this.kind }),
        description: '',
        template_name: 'old_common/views/dialog_base',
        clean_on_hide: true,
        ok_button_classes: "button grey disabled",
        cancel_button_classes: "hide",
        ok_title: this._TEXTS.ok,
        modal_type: "creation asset_manager",
        width: this.kind === "marker" ? 740 : 643
      });

      this.constructor.__super__.initialize.apply(this);
    },

    ////////////
    // RENDER //
    ////////////

    render_content: function() {
      var $content = this.$content = $("<div>");
      this.temp_content = this.getTemplate('table/views/asset_manager/asset_manager');
      $content.append(this.temp_content({ kind: this.kind }));

      // Get user images collection
      this.init_assets($content);

      // Render option tabs
      this.render_option_tabs($content);

      // Init uploader
      this._init_uploader($content);

      return $content;
    },

    render_option_tabs: function($content) {
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

      // Render assets pane
      this._renderAssetsPane($content);

      // Render assets panes only if kind type
      // is a marker
      if (this.kind === "marker") {
        this._renderMakisPane($content);
        this._renderSimpleiconPane($content);
        this._renderPinmapsiconPane($content);
      }

      // Render file pane
      this._renderFilePane($content);

      // Render dropbox pane
      this._renderDropboxPane($content);

      $content.append(this.upload_panes.render());
      
      this.upload_panes.active( this.kind === "marker" ? 'simpleicon' : 'file' );
    },

    _renderAssetsPane: function() {
      this.assetsPane = new cdb.admin.AssetsPane({
        collection: this.collection,
        kind:       this.kind
      });
    },

    _renderSimpleiconPane: function() {
      this.simpleiconPane = new cdb.admin.StaticAssetsPane({
        collection: this.collection,
        kind:       this.kind,
        icons:      simpleicon.icons,
        disclaimer: simpleicon.disclaimer,
        folder:     'simpleicon',
        size:       ''
      });

      this.simpleiconPane.bind('fileChosen', this._checkOKButton, this);
      this.upload_panes.addTab('simpleicon', this.simpleiconPane);

      // Don't render (and request) simpleicon images until
      // tab is enabled for the first time
      this.upload_panes.bind('tabEnabled:simpleicon', function() {
        this.simpleiconPane.render();
        this.upload_panes.unbind('tabEnabled:simpleicon', null, null);
      }, this);
    },

    _renderPinmapsiconPane: function() {
      this.pinmapsPane = new cdb.admin.StaticAssetsPane({
        collection: this.collection,
        kind:       this.kind,
        icons:      pin_maps.icons,
        disclaimer: pin_maps.disclaimer,
        folder:     'pin-maps',
        size:       ''
      });

      this.pinmapsPane.bind('fileChosen', this._checkOKButton, this);
      this.upload_panes.addTab('pin-maps', this.pinmapsPane);

      // Don't render (and request) pin-maps images until
      // tab is enabled for the first time
      this.upload_panes.bind('tabEnabled:pin-maps', function() {
        this.pinmapsPane.render();
        this.upload_panes.unbind('tabEnabled:pin-maps', null, null);
      }, this);
    },

    _renderMakisPane: function() {
      this.makisPane = new cdb.admin.StaticAssetsPane({
        collection: this.collection,
        kind:       this.kind,
        icons:      maki_icons.icons,
        disclaimer: maki_icons.disclaimer,
        folder:     'maki-icons',
        size:       '18'
      });

      this.makisPane.bind('fileChosen', this._checkOKButton, this);
      this.upload_panes.addTab('maki', this.makisPane);

      // Don't render (and request) maki images until
      // tab is enabled for the first time
      this.upload_panes.bind('tabEnabled:maki', function() {
        this.makisPane.render();
        this.upload_panes.unbind('tabEnabled:maki', null, null);
      }, this);
    },

    _renderFilePane: function() {
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

    init_assets: function() {
      this.collection.bind('add remove reset',  this._onAssetsFetched,  this);
      this.collection.bind('change',            this._checkOKButton,    this);
      this.collection.fetch();
    },

    _onAssetsFetched: function() {
      // Enable or disable uploaded images pane
      var items = this.collection.where({ kind: this.kind }).length;
      if (items === 0) {
        this.upload_tabs.disable('assets');
        this.upload_panes.removeTab('assets');
        this.upload_panes.active( this.kind === "marker" ? 'simpleicon' : 'file' );
      } else {
        this.upload_tabs.enable('assets');
        if (!this.upload_panes.getPane('assets')) {
          this.upload_panes.addTab('assets', this.assetsPane);
        }
        this.upload_panes.active('assets');
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




    //////////////////
    //  UI ACTIONS  //
    //////////////////

    // Check
    _checkOKButton: function() {
      var action = 'addClass';
      var pane = this.upload_panes.activePane;
      var tab = this.upload_panes.activeTab;
      var state = this.model.get('state');
      var value = pane.getValue();
      var text = this._TEXTS.ok[tab];

      this.$("a.ok")
        .text(text)
        [ value && state === "idle" ? 'removeClass' : 'addClass' ]('disabled')
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

      var pane = this.upload_panes.activePane;
      var tab = this.upload_panes.activeTab;
      var state = this.model.get('state');
      var value = pane.getValue();
      var text = this._TEXTS.ok[tab];

      // Uploading or other state, no way!
      if (state !== "idle" || !value) return false;

      if (tab === "file" || tab === "dropbox") {
        pane.submitUpload()
      } else {
        this.trigger('fileChosen', value);
        this.hide();
      }

      return false;
    },

    open: function(options) {
      var self = this;

      this.trigger("will_open", this);

      this.$(".modal").css({
        "opacity": "0",
        "marginTop": "120px"
      });

      this.$(".mamufas").fadeIn();
      this.$(".modal").animate({
        marginTop: "70px",
        opacity: 1
      }, 300);
    },

    ////////////////////////
    //  HELPER FUNCTIONS  //
    ////////////////////////

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
