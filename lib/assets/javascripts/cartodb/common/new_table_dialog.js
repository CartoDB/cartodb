



cdb.admin.CreateTableDialog = cdb.ui.common.Dialog.extend({

  _TEXTS: {
    title:    _t("New table"),
    ok: {
      normal: _t("Create table"),
      empty:  _t("Create empty table")
    }
  },

  _UPLOADER: {
    url:              '/api/v1/imports',
    maxFileSize:      100000000,
    maxUploadFiles:   1,
    acceptFileTypes:  /(\.|\/)(csv|xlsx?|zip|kml|geojson|json|ods|kmz|gpx|tar|gz|tgz|osm|bz2|tif|tiff|txt)$/i
  },

  initialize: function() {
    _.bindAll(this, "_onUploadProgress", "_onUploadStart", "_onUploadAbort",
      "_onUploadAdd", "_onUploadComplete", "_keydown");

    // Extend options
    _.extend(this.options, {
      title: this._TEXTS.title,
      description: '',
      template_name: 'common/views/create_dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button green disabled",
      ok_title: this._TEXTS.ok.normal,
      ok_title_empty: this._TEXTS.ok.empty,
      modal_type: "creation",
      width: 600
    });
    this.constructor.__super__.initialize.apply(this);
  },

  render_content: function() {
    var $content = this.$content = $("<div>");
    this.temp_content = cdb.templates.getTemplate('common/views/create_dialog_content');
    $content.append(this.temp_content());

    // Render dialog tabs
    this.render_dialog_tabs($content);

    // Render file tabs
    this.render_upload_tabs($content);

    // Init uploader
    this._init_uploader($content);

    return $content;
  },

  render_dialog_tabs: function($content) {},

  render_upload_tabs: function($content) {
    // Tabs
    this.tabs = new cdb.admin.Tabs({
      el: $content.find('.upload-tabs')
    });
    this.addView(this.tabs);

    // File pane
    this.filePane = new cdb.admin.ImportFilePane({
      template: cdb.templates.getTemplate('common/views/import_file'),
      maxFileSize: this.options.quota,
      maxUploadFiles: this._UPLOADER.maxUploadFiles
    });
    this.filePane.bind('fileChosen', this._uploadData, this);
    this.addView(this.filePane);

    // GDrive
    this.gdrivePane = new cdb.admin.ImportPane({
      template: cdb.templates.getTemplate('common/views/import_gdrive')
    });
    this.gdrivePane.bind('fileChosen', this._uploadData, this);
    this.addView(this.gdrivePane);

    // Dropbox
    this.dropboxPane = new cdb.admin.ImportPane({
      template: cdb.templates.getTemplate('common/views/import_dropbox'),
      app_api_key: 'gy3nqo2op179l74'
    });
    this.dropboxPane.bind('fileChosen', this._uploadData, this);
    this.addView(this.dropboxPane);

    // Create TabPane
    this.panes = new cdb.ui.common.TabPane({
      el: $content.find(".upload-panes")
    });
    this.panes.addTab('file', this.filePane);
    this.panes.addTab('gdrive', this.gdrivePane);
    this.panes.addTab('dropbox', this.dropboxPane);

    this.tabs.linkToPanel(this.panes);
    this.addView(this.panes);
    $content.append(this.panes.render());

    this.panes.active('file');
  },




  _init_uploader: function($content) {
    // Create all components vars
    this.$loader      = $content.find("div.progress");
    this.$list        = $content.find("ul.options");
    this.$import      = $content.find("div.upload");
    this.$error       = this.$el.find("section.modal.error");
    this.$importation = this.$el.find("section.modal:eq(0)");

    // Create the fileupload
    var $upload = this.$upload = $content.find("form.dialog-uploader");
    $upload.fileupload({
      url:                    this._UPLOADER.url,
      paramName:              'filename',
      progressInterval:       100,
      bitrateInterval:        500,
      maxFileSize:            this._UPLOADER.maxFileSize,
      autoUpload:             true,
      limitMultiFileUploads:  this._UPLOADER.maxUploadFiles,
      limitConcurrentUploads: this._UPLOADER.maxUploadFiles,
      add:                    this._onUploadAdd,
      progress:               this._onUploadProgress,
      start:                  this._onUploadStart,
      done:                   this._onUploadComplete,
      fail:                   this._onUploadError
    });


    // Have you dropped a file in the big mamufas?
    this._checkFiles();

    return this.$content;
  },


  // Check if any file has been dropped with big mamufas
  // or started with an url link.
  _checkFiles: function() {
    var self = this;

    if (this.options.files) {
      if (this.options.files.length != 1) {
        this._onUploadError(null, {files: [{name: "", error: "maxUploadFiles"}]});
      } else {
        setTimeout(function(){
          $upload.fileupload('add', {files: self.options.files});
        },150);
      }

    } else if (this.options.url) {

      setTimeout(function(){
        // Have you added a url?
        // self.$import.find("input[type='text']").val(self.options.url);
        // self._onInputChange();
        // self._onSubmitForm();
        alert("LINK!!");
      },150);
    }
  },


  _uploadData: function(type, file) {
    if (type === "file") {
      this.$upload.fileupload('add', {files: file});
    } else {
      alert("ayyyyy");
    }
  },


    // When an upload starsts
  _onUploadStart: function(ev,data) {
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
  _onUploadProgress: function(ev,data) {
    var loaded = data.loaded
      , total = data.total;

    var percentage = (loaded / total) * 100;
    this.$content
      .find("div.progress span")
      .width(percentage + "%");
  },

  // If user cancels an upload
  _onUploadAbort: function(ev) {
    if (ev)
      ev.preventDefault();
    this.jqXHR.abort();
  },

  // Upload complete, YAY!
  _onUploadComplete: function(ev,data) {
    this._changeState("importing");
    console.log("importing!");
    // this._importTable(data.result.item_queue_id);
  },


  // When a file is added, start the upload
  _onUploadAdd: function(ev,data) {
    if (data.originalFiles.length == 1) {
      this.jqXHR = data.submit();
    }
  },


  // Change ui state (NEW)
  _changeState: function(mode) {
    var actions = cdb.admin.upload_states[mode];

    // Set dialog params
    this.enable = actions.enable;
    this.option = actions.option;

    // Remove additional and error info
    if (actions.hideUpload)
      this._hideUploadError();

    // Change title
    this.$importation
      .find("h3")
      .text(actions.title);

    // Change description
    this.$importation
      .find("div.head p")
      .text(actions.description);

    // Hide close?
    this.$importation.find("a.close").stop()[actions.hideClose ? "fadeOut" : "fadeIn"]();

    // Main button (OK) classes
    this.$importation.find("div.foot a.ok")
      .removeClass(actions.ok.removeClasses)
      .addClass(actions.ok.addClasses)
      .text(actions.ok.text);

    // Adding foot description?
    if (actions.foot) {
      var $foot_desc = $("<p>").addClass("margin5 left small").text(actions.foot.text);

      this.$importation
        .find("div.foot")
        .append($foot_desc);
    }

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


  /**
   *  APP ACTIONS (create, import, error)
   */

  // Import table
  _importTable: function(item_queue_id) {

    var self = this
      , imp = this.importation = new cdb.admin.Import({item_queue_id: item_queue_id})
            .bind("importComplete", function(e){
              imp.unbind();

              if (imp.get('tables_created_count') && imp.get('tables_created_count')>1) {
                // Reload tables
                $.when(self.options.tables.fetch()).done(function() {
                  self.options.tables.trigger('sync');
                }).fail(function(){
                  self.options.tables.trigger('loadFailed');
                });

                // Hide dialog
                self.hide();
              } else {
                window.location.href = "/tables/" + imp.get("table_name") + "/";
              }
            },this)
            .bind("importError", function(e){
              self._showError(e.attributes.error_code,e.attributes.get_error_text.title,e.attributes.get_error_text.what_about);
            },this);

    imp.pollCheck();

    this.item_queue_id = item_queue_id;
  },

  // Create a new table from scratch
  _createTable: function() {
    var self            = this
      , created         = false
      , creationFailed  = function(e) {
        // Already created?
        if (created) return false;

        self._hideLoader();
        try {
          self._showError(e.attributes.error_code,e.attributes.get_error_text.title,e.attributes.get_error_text.what_about);
        } catch(e) {
          self._showError('99999','Unknown', 'Sorry, something went wrong and we\'re not sure what. Contact us at <a href="mailto:contac@cartodb.com">contact@cartodb.com</a>.');
        }
      }
      , creationDone = function(a,b,c) {
        window.location = "/tables/" + self.options.tables.at(0).get('name') + "/";
      };

    // Bind tables change
    this.options.tables
      .bind("add", function(m) {
        created = true;
        window.location = "/tables/" + m.get("name") + "/";
      },this)
      .bind("error", creationFailed, this)

    // Create the new table
    this.options.tables
      .create()
      // Check if collection can create
      .fail(creationFailed);
  },

  // Show error when an import fails
  _showError: function(number,description,wadus) {
    // Add data
    var template = cdb.templates.getTemplate("common/views/error_dialog_content")
      , opts = {number: number, description: description, about:wadus};

    this.$error.find("div.error_content").html(template(opts));

    // Show error and hide importation window
    this.$el.find(".modal:eq(0)").animate({
      opacity: 0,
      marginTop: 0,
      height: 0,
      top: 0
    },function(){
      $(this).remove();
    });

    this.$el.find(".modal:eq(1)")
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





























  // Hide the dialog
  hide: function() {
    var self = this;

    this.$el.find(".modal").animate({
      marginTop: "50px",
      opacity: 0
    },300, function() {
      if(self.options.clean_on_hide) {
        self.clean();
      }
    });
    this.$el.find(".mamufas").fadeOut(300);
    this.trigger("closedDialog", this , this);
  },


  // Show the dialog
  open: function() {
    var self = this;

    this.$el.find(".modal").css({
      "opacity": "0",
      "marginTop": "170px"
    });

    this.$el.find(".mamufas").fadeIn();
    this.$el.find(".modal").animate({
      marginTop: "120px",
      opacity: 1
    },300);
  },

  // Close the dialog only if it is enable
  _keydown: function(e) {
    if (e.keyCode === 27 && this.enable) {
      if (this.option == 3) {
        this.ok();
      } else {
        this._cancel();
      }
    }
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
})
