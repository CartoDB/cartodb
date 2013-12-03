
  /*
   *  Dialog to append new data to an existant CartoDB table.
   *
   *  - A user model, to check remaining quota, if user can sync table,... etc.
   *  - Tables collection needed for import/creation process.
   *  - It creates a model to control the state of the dialog:
   *   · State: what is doing the dialog -> (idle, uploading, importing or error)
   *   · Option: option clicked -> (file for the moment)
   *
   *  new cdb.admin.AppendDataDialog({
   *    tables: new cdb.admin.Tables(),
   *    user: user_model
   *  });
   *
   */


  cdb.admin.AppendDataDialog = cdb.ui.common.Dialog.extend({

    _TEXTS: {
      title:      _t("Append more data"),
      ok:         _t("Append data"),
      error: {
        default:  _t('Ooops, there was an error in the importation, please try again.'),
        sorry:    _t('Sorry, something went wrong and we\'re not sure what. Contact us at \
                      <a href="mailto:contac@cartodb.com">contact@cartodb.com</a>.'),
        unknown:  _t('Unknown')
      }
    },

    events: function(){
      return _.extend({},cdb.ui.common.Dialog.prototype.events,{
        'click .upload-progress a.stop':  '_onUploadAbort'
      });
    },

    _UPLOADER: {
      url:              '/api/v1/imports',
      maxFileSize:      100000000,
      maxUploadFiles:   1,
      acceptFileTypes:  ['csv','xls','xlsx','zip','kml','geojson','json','ods','kmz','tsv',
                         'gpx','tar','gz','tgz','osm','bz2','tif','tiff','txt','sql'],
      acceptSync:       undefined
    },

    initialize: function() {
      _.bindAll(this, "_onUploadProgress", "_onUploadStart", "_onUploadAbort",
        "_onUploadAdd", "_onUploadComplete", "_onUploadError", "_keydown");

      // Extend options
      _.extend(this.options, {
        title: this._TEXTS.title,
        description: '',
        template_name: 'common/views/create_dialog_base',
        clean_on_hide: true,
        ok_button_classes: "button grey disabled",
        ok_title: this._TEXTS.ok,
        modal_type: "creation append_data_dialog",
        width: 600,
        show_upgrade_message: false
      });

      // Set options variables
      this.user = this.options.user;

      // Set user limits
      this._setUserLimits();

      // Create a model to know the options clicked
      // and the state of the dialog
      this.model = new cdb.core.Model({
        option: 'file',
        state:  'idle'
      });

      // Super!
      this.constructor.__super__.initialize.apply(this);
    },

    _setUserLimits: function() {
      // Size quota remaining
      if (!_.isNull(this.user.get('remaining_byte_quota'))) {
        this._UPLOADER.maxFileSize = this.user.get("remaining_byte_quota") * ( this.user.get("actions").import_quota || 1 );
      }

      // Remaining table quota
      if (!_.isNull(this.user.get('remaining_table_quota'))) {
        this._UPLOADER.remainingQuota = (_.isNull(this.user.get("remaining_table_quota")) || this.user.get("remaining_table_quota") > 0)
      }

      // Sync tables?
      if (!_.isNull(this.user.get('actions')) && this.user.get('actions').sync_tables) {
        this._UPLOADER.acceptSync = this.user.get('actions').sync_tables;
      }
    },


    //////////////
    //  RENDER  //
    //////////////

    render_content: function() {
      var $content = this.$content = $("<div>");
      this.temp_content = cdb.templates.getTemplate('table/header/views/append_data_content');
      $content.append(this.temp_content());

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
      this.addView(this.upload_panes);

      this.upload_tabs.linkToPanel(this.upload_panes);

      // Render file pane
      this._renderFilePane($content);

      // Google Drive
      this._renderGDrivePane($content);

      // Dropbox
      this._renderDropboxPane($content);

      this.upload_panes.bind('tabEnabled', this._checkOKButton, this);
      $content.append(this.upload_panes.render());
      this.upload_panes.active('file');
    },

    _renderFilePane: function($content) {
      this.filePane = new cdb.admin.ImportFilePane({
        maxFileSize:      this._UPLOADER.maxFileSize,
        maxUploadFiles:   this._UPLOADER.maxUploadFiles,
        acceptFileTypes:  this._UPLOADER.acceptFileTypes,
        acceptSync:       this._UPLOADER.acceptSync
      });
      this.filePane.bind('fileChosen', this._uploadData, this);
      this.filePane.bind('valueChange', this._checkOKButton, this);
      this.upload_panes.addTab('file', this.filePane);
    },

    _renderDropboxPane: function($content) {
      if (cdb.config.get('dropbox_api_key')) {
        this.dropboxPane = new cdb.admin.ImportDropboxPane({
          acceptFileTypes:  this._UPLOADER.acceptFileTypes,
          acceptSync:       this._UPLOADER.acceptSync
        });
        this.dropboxPane.bind('fileChosen', this._uploadData, this);
        this.dropboxPane.bind('valueChange', this._checkOKButton, this);
        this.upload_panes.addTab('dropbox', this.dropboxPane);
      } else {
        $content.find('a.dropbox').parent().remove();
      }
    },

    _renderGDrivePane: function($content) {
      if (cdb.config.get('gdrive_app_id')) {
        this.gdrivePane = new cdb.admin.ImportGdrivePane({
          acceptSync: this._UPLOADER.acceptSync
        });
        this.gdrivePane.bind('fileChosen', this._uploadData, this);
        this.gdrivePane.bind('valueChange', this._checkOKButton, this);
        this.upload_panes.addTab('gdrive', this.gdrivePane);
      } else {
        $content.find('a.gdrive').parent().remove();
      }
    },



    ////////////////////////
    //  UPLOADER ACTIONS  //
    ////////////////////////

    // Create uploader
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
        url:                    this._UPLOADER.url,
        paramName:              'filename',
        progressInterval:       100,
        bitrateInterval:        500,
        maxFileSize:            this._UPLOADER.maxFileSize,
        autoUpload:             true,
        limitMultiFileUploads:  this._UPLOADER.maxUploadFiles,
        limitConcurrentUploads: this._UPLOADER.maxUploadFiles,
        acceptFileTypes:        this._setValidFileExtensions(this._UPLOADER.acceptFileTypes),
        add:                    this._onUploadAdd,
        progress:               this._onUploadProgress,
        start:                  this._onUploadStart,
        done:                   this._onUploadComplete,
        fail:                   this._onUploadError
      });

      // Set uploader widget
      this.uploader = this.$upload.data('fileupload');

      // Hide importation error
      this.$error.hide();

      return this.$content;
    },

    _setValidFileExtensions: function(list) {
      return RegExp("(\.|\/)(" + list.join('|') + ")$", "i");
    },

    // Upload data function where file is chosen
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

      // Change the state
      this._changeState("importing");

      // Import from url
      this._importURL(obj);
    },


    // Starts url import
    _importURL: function(obj) {
      var self = this;

      var imp = new cdb.admin.Imports({
        url: obj.value,
        table_name: this.options.table.get('id'),
        append: true
      });

      imp.save(null, {
        success: function(mdl, res) {
          self._importTable(res);
        },
        error: function(e) {
          self._showError('', self._TEXTS.error.default, self._TEXTS.error.sorry);
        }
      });
    },

      // When an upload starsts
    _onUploadStart: function(e, data) {
      // Setting state
      this.model.set('state', 'uploading');

      this._changeState("uploading");
      if (data.files && data.files.length > 0) {
        cdb.god.trigger('mixpanel', "Uploading a file", {
          filename: data.files[0].name,
          type: data.files[0].type,
          size: data.files[0].size
        });
      }
    },

    // Change progress of a file
    _onUploadProgress: function(e, data) {
      var loaded = data.loaded
        , total = data.total;

      var percentage = (loaded / total) * 100;
      this.$content
        .find(".upload-progress span")
        .width(percentage + "%");
    },

    // If user cancels an upload
    _onUploadAbort: function(e) {
      this._changeState('reset');

      // Setting state
      this.model.set('state', 'idle');

      if (e) e.preventDefault();
      this.jqXHR.abort();
    },

    // If upload fails
    _onUploadError: function(e, data) {
      this._changeState('reset');

      if (this.filePane) {
        // Activate file tab
        this.upload_panes.active('file');

        // Set default error
        data.files[0].error = 'connection';

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

    // Upload complete, YAY!
    _onUploadComplete: function(e, data) {
      this._changeState("importing");
      this._importTable(data.result);
    },

    // When a file is added, start the upload
    _onUploadAdd: function(e, data) {
      if (data.originalFiles.length == 1) {
        
        data.formData = {
          append: true,
          table_name: this.options.table.get('id')
        };

        this.jqXHR = data.submit();
      }
    },



    //////////////////
    //  UI ACTIONS  //
    //////////////////

    // Check
    _checkOKButton: function() {
      var option = this.model.get('option');
      var $ok = this.$("a.ok");
      var action = 'addClass';
      var text = this._TEXTS.ok.normal;
  
      var pane = this.upload_panes.activePane;
      var value = pane.model.get('value');

      action = value ? 'removeClass' : 'addClass';

      $ok
        [action]('disabled')
        .text(text)
    },

    // Show loader
    _showLoader: function() {
      this.$loader.addClass("active");
    },

    // Hide loader
    _hideLoader: function() {
      this.$loader.removeClass("active creating uploading");
    },

    // Change ui state (NEW)
    _changeState: function(mode) {
      var actions = cdb.admin.upload_states[mode];

      // Set dialog params
      this.enable = actions.enable;
      this.option = actions.option;

      // Change title
      this.$importation
        .find("h3")
        .text(actions.title);

      // Change description
      this.$importation
        .find("div.head p")
        .text(actions.description);

      // Hide close?
      this.$importation.find("a.close").stop()[actions.hideClose ? "hide" : "show"]();

      // Main button (OK) classes
      this.$importation.find("div.foot a.ok")
        .removeClass(actions.ok.removeClasses)
        .addClass(actions.ok.addClasses)
        .text(actions.ok.text)
        [mode == 'reset' ? 'show' : 'hide']();

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



    ///////////////////////////////////////////
    //  APP ACTIONS  (create, import, error) //
    ///////////////////////////////////////////

    // Import table
    _importTable: function(item) {
      // Setting state
      this.model.set('state', 'importing');

      // Destroy previous importation if exists.
      if (this.importation){
        this.importation.unbind();
        this.importation.destroyCheck();
      }

      var self = this;
      var imp = this.importation = new cdb.admin.Import({
        item_queue_id: item.item_queue_id
      });

      // Set url root for import model if exists
      if (item.endpoint) imp.setUrlRoot(item.endpoint)

      imp.bind("importComplete", function(e){
        this.trigger('importComplete', this)
        this.hide();
      },this)

      imp.bind("importError", function(e){
        imp.unbind();
        self._showError(
          e.attributes.error_code,
          e.attributes.get_error_text.title,
          e.attributes.get_error_text.what_about
        );
      },this);

      imp.bind("importChange", function(m){
        self.$loader.find('p').text(m.get("state") + "...");
      },this);

      imp.pollCheck();

      this.item_queue_id = item.item_queue_id;
    },


    // Show error when an import fails
    _showError: function(number,description,wadus) {
      // Setting state
      this.model.set('state', 'error');

      // Add data
      var template = cdb.templates.getTemplate("common/views/error_dialog_content")
        , opts = {number: number, description: description, about:wadus};

      this.$error.find("div.error_content").html(template(opts));

      // Show error and hide importation window
      this.$(".modal:eq(0)").animate({
        opacity: 0,
        marginTop: 0,
        height: 0,
        top: 0
      },function(){
        $(this).remove();
      });

      this.$(".modal:eq(1)")
        .css({
          opacity:0,
          display:"block",
          marginTop: "0px"
        })
        .animate({
          opacity: 1,
          marginTop: "100px"
        },600);
    },



    ////////////////////////
    //  DIALOG FUNCTIONS  //
    ////////////////////////

    // Hide the dialog
    hide: function() {
      var self = this;

      this.$(".modal").animate({
        marginTop: "50px",
        opacity: 0
      },300, function() {
        if(self.options.clean_on_hide) {
          self.clean();
        }
      });
      this.$(".mamufas").fadeOut(300);
      this.trigger("closedDialog", this);
    },


    // Show the dialog
    open: function() {
      var self = this;

      this.$(".modal").css({
        "opacity": "0",
        "marginTop": "170px"
      });

      this.$(".mamufas").fadeIn();
      this.$(".modal").animate({
        marginTop: "120px",
        opacity: 1
      },300);
    },


    // Close the dialog only if state is error or idle
    _keydown: function(e) {
      if (e.keyCode === 27 &&
        (
          this.model.get('state') == "idle" ||
          this.model.get('state') == "error"
        )
      ) {
        this.hide();
      }
    },

    // Click over the OK button
    _ok: function(ev) {
      if (ev)
        ev.preventDefault();

      // If state is not idle or error, blocked!
      if (!this._isEnabled()) return false;

      var state = this.model.get('state');
      var option = this.model.get('option');

      // Let's surf in the options
      switch (state) {
        case 'idle':
          var upload_pane = this.upload_panes.activePane;
          upload_pane.submitUpload();
          break;
        case 'importing':
          if(this.importation) {
            this.importation.unbind();
            this.importation.destroyCheck();
          }
          this.trigger('importStarted', this.item_queue_id);
          this.hide();
          break;
        default:
          cdb.log.info("Not listed state in create window");
      }
    },



    ////////////////////////
    //  HELPER FUNCTIONS  //
    ////////////////////////

    _isEnabled: function() {
      if (
        this.model.get('state') != "idle" &&
        this.model.get('state') != "error" &&
        this.model.get('state') != "importing") {
        return false;
      }
      return true;
    },

    // True cleanning
    clean: function() {
      // Destroy fileupload
      this.$upload.fileupload("destroy");

      // Remove keydown binding
      $(document).unbind('keydown', this._keydown);

      // Cancel upload in case there is one active
      if (this.jqXHR) this._onUploadAbort();

      cdb.ui.common.Dialog.prototype.clean.call(this);
    }
  });
