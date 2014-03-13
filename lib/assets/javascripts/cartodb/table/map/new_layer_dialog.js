
  /*
   *  Dialog to import new files/tables to your visualization.
   *
   *  - It needs a visualization model and the tables visualization
   *    model and, only if you want, the quota.
   *  - A user model, to check remaining quota, if user can sync table,... etc.
   *  - It creates a model to control the state of the dialog:
   *   · State: what is doing the dialog -> (idle, uploading, importing or error)
   *   · Option: option clicked -> (tables, file or scratch)
   *
   *
   *  new cdb.admin.NewLayerDialog({
   *    tables: new cdb.admin.Visualizations(),
   *    vis: vis_model,
   *    user: user_model
   *  });
   *
   */


  cdb.admin.NewLayerDialog = cdb.admin.BaseDialog.extend({

    _TEXTS: {
      title:      _t("Add layer"),
      desc:       _t("You can import data to this map or add one of your existing tables."),
      ok: {
        normal:   _t("Add layer")
      },
      error: {
        default:  _t('Ooops, there was an error in the importation, please try again.'),
        sorry:    _t('Sorry, something went wrong and we\'re not sure what. Contact us at \
                      <a href="mailto:contac@cartodb.com">contact@cartodb.com</a>.'),
        unknown:  _t('Unknown')
      },
      maxFileSizeError: _t('Looks like your file is too big for your available quota. <a \
                            href="#/showUpgrade" class="button green small upgrade">Upgrade now</a>')
    },

    events: function(){
      return _.extend({},cdb.admin.BaseDialog.prototype.events,{
        'click .dialog-tab > a':          '_optionClicked',
        'click .upload-progress a.stop':  '_onUploadAbort'
      });
    },

    _UPLOADER: {
      url:              '/api/v1/imports',
      maxFileSize:      10000000,
      maxUploadFiles:   1,
      remainingQuota:   true, // true is user can upload/create new tables
      acceptFileTypes:  ['csv','xls','xlsx','zip','kml','geojson','json','ods','kmz','tsv',
                         'gpx','tar','gz','tgz','osm','bz2','tif','tiff','txt','sql'],
      acceptSync:       false
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
        ok_title: this._TEXTS.ok.normal,
        ok_title_empty: this._TEXTS.ok.empty,
        modal_type: "creation new_layer_dialog",
        width: 600,
        show_upgrade_message: false //,
        // account_type: this.options.user.get('account_type'),
        // upgrade_url: window.location.protocol + '//' + config.account_host + "/account/" + this.options.user.get('username') + "/upgrade"
      });

      // Set ok function
      this.ok = this.options.ok;
      // Set options variables
      this.vis = this.options.vis;
      this.tables = this.options.tables;
      this.user = this.options.user;

      // Set user limits
      this._setUserLimits();

      // Create a model to know the options clicked
      // and the state of the dialog
      this.model = new cdb.core.Model({
        option: 'tables',
        state:  'idle'
      });

      this.model.bind('change:option', this._onOptionChange, this);

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
      this.temp_content = cdb.templates.getTemplate('table/views/new_layer_dialog');
      $content.append(this.temp_content(this._UPLOADER));

      // Render tables option
      this.render_tables($content)

      // If user has remaining tables to upload/create
      if (this._UPLOADER.remainingQuota) {
        // Render the file tabs
        this.render_upload_tabs($content);
      } else {
        // Set tooltips for disabled options
        this.render_tooltips($content);
      }

      // Init uploader
      this._init_uploader($content);

      return $content;
    },

    render_tooltips: function($content) {
      // Apply tooltip to any disabled option
      $content.find('a.radiobutton.disabled').tipsy({
        fade: true,
        gravity: 's',
        offset: 5
      });
    },

    render_tables: function($content) {

      this.tables.options.set({ type: 'table', per_page:300, table_data: false });
      var order = { data: { o: { updated_at: "desc" }}};

      this.table_selection = new cdb.core.Model();

      this.tables.bind('reset', this._onTablesFetched,  this);
      this.tables.bind('error', this._onTablesError,    this);
      this.tables.fetch(order);
      this.add_related_model(this.tables);
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
      // this._renderGDrivePane($content);

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
        acceptSync:       this._UPLOADER.acceptSync,
        maxFileSizeError: this._TEXTS.maxFileSizeError
      });
      this.filePane.bind('fileChosen', this._uploadData, this);
      this.filePane.bind('valueChange', this._checkOKButton, this);
      this.filePane.bind('showUpgrade', this._showUpgrade, this);
      this.upload_panes.addTab('file', this.filePane);
    },

    _renderDropboxPane: function($content) {
      if (cdb.config.get('dropbox_api_key')) {
        this.dropboxPane = new cdb.admin.ImportDropboxPane({
          acceptFileTypes: this._UPLOADER.acceptFileTypes,
          acceptSync:      this._UPLOADER.acceptSync
        });
        this.dropboxPane.bind('fileChosen', this._uploadData, this);
        this.dropboxPane.bind('valueChange', this._checkOKButton, this);
        this.dropboxPane.bind('showUpgrade', this._showUpgrade, this);
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
        this.gdrivePane.bind('showUpgrade', this._showUpgrade, this);
        this.upload_panes.addTab('gdrive', this.gdrivePane);
      } else {
        $content.find('a.gdrive').parent().remove();
      }
    },


    //////////////////////
    //  TABLES ACTIONS  //
    //////////////////////

    _onTablesFetched: function() {
      this.tables.unbind(null, null, this);

      if (this.tableCombo) this.tableCombo.clean();

      var table_list = this.tables.pluck('name');
      var first_table = table_list[0];

      if (first_table) {
        this.table_selection.set('table', first_table);
        this._onTableSelected(first_table);
      }

      this.table_combo = new cdb.forms.Combo({
        el: this.$content.find('.tableListCombo'),
        model: this.table_selection,
        property: "table",
        width: '468px',
        extra: table_list
      });

      this.table_combo.bind('change', this._onTableSelected, this)
      this.table_combo.render();
      this.addView(this.table_combo);
      this.$(".combo_wrapper").fadeIn(250);

      // Show list and hide loader
      this._hideTablesLoader();
      this._showTablesList();
      this._hideTablesError();
    },

    _onTablesError: function() {
      this._hideTablesLoader();
      this._removeTablesList();
      this._showTablesError();
    },

    _onTableSelected: function(table_name) {
      this._checkOKButton();

      var self = this;

      // Remove all warnings
      this._hideTablesGeoWarning();

      // Get table from tables collection
      var table_vis = this.tables.find(function(table){ return table.get('name') == table_name; });

      // Check if table has any georeference data and warn the user :S
      var table_metadata = new cdb.admin.CartoDBTableMetadata({ id: table_vis.get("table").id });
      table_metadata.fetch({
        success: function(m) {
          // Check if actual table is the same requested
          if (self.table_selection.get('table') == m.get('name') && m.get('geometry_types').length == 0) {
            self._showTablesGeoWarning();
          }
        }
      });

    },

    /////////////////
    //  TABLES UI  //
    /////////////////

    _showTablesGeoWarning: function() { this.$('p.warning.geo').fadeIn(); },

    _hideTablesGeoWarning: function() { this.$('p.warning.geo').fadeOut(); },

    _showTablesLoader: function() { this.$('span.loader').fadeIn(); },

    _hideTablesLoader: function() { this.$('span.loader').hide(); },

    _showTablesError: function() { this.$('p.warning.error').fadeIn(); },

    _hideTablesError: function() { this.$('p.warning.error').fadeOut(); },

    _showTablesList: function() { this.$('.options').css('opacity', 1); },

    _removeTablesList: function() { this.$('.options ul.options').remove(); },


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

      if (obj.interval > 0) {
        this._importSync(obj);
      } else {
        this._importURL(obj);
      }
    },

    // Starts sync import
    _importSync: function(obj) {
      var self = this;

      // Create synchronization model if it is
      // necessary
      var synchronization = new cdb.admin.TableSynchronization({
        url: obj.value,
        interval: obj.interval
      });

      synchronization.save(null, {
        success: function(sync) {
          self._importTable(sync.get('data_import'));
        },
        error: function(e) {
          self._showError('', self._TEXTS.error.default, self._TEXTS.error.sorry);
        }
      });
    },

    // Starts url import
    _importURL: function(obj) {
      var self = this;

      var imp = new cdb.admin.Imports({
        url: obj.value
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
      // Change UI
      this._changeState("uploading");
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
      this._changeState('reset')

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

    // Upload complete, YAY!
    _onUploadComplete: function(ev,data) {
      this._changeState("importing");
      this._importTable(data.result);
    },

    // When a file is added, start the upload
    _onUploadAdd: function(ev,data) {
      if (data.originalFiles.length == 1) {
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

      switch (option) {
        case 'tables':
          if (this.table_selection.get('table')) {
            action = 'removeClass';
          } else {
            action = 'addClass';
          }
          break;
        case 'scratch':
          action = "removeClass";
          break;
        case 'file':
          var pane = this.upload_panes.activePane;
          var value = pane.model.get('value');

          action = value ? 'removeClass' : 'addClass';
          break;
        default: break;
      }

      $ok[action]('disabled')
    },

    // If other option has changed
    _onOptionChange: function(m) {
      // Setup dialog tabs
      this.$('.dialog-tab > a').removeClass('selected');
      var option = this.model.get('option');
      this.$('.dialog-tab.' + option + ' > a').addClass('selected');

      // Setup dialog panes
      this.$('.dialog-tab').removeClass('active');
      this.$('.dialog-tab.' + option).addClass('active');

      // Activate upload pane previous chosen
      if (option == "file") {
        this.upload_tabs.activate(this.upload_panes.activeTab);
      }

      // Check new option to enable or disable ok button
      this._checkOKButton();
    },

    _optionClicked: function(e) {
      if (e) e.preventDefault();

      // Get new option and set it in the model
      // (Taking it from the link)
      var href = $(e.target).attr('href');
      var option = href && href.replace('#/', '');

      if (option && this.model.get('option') != option) {
        this.model.set('option', option);
      }
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
      this.$importation.find("a.close").stop()[actions.hideClose ? "fadeOut" : "fadeIn"]();

      // Main button (OK) classes
      if (mode == 'importing') {
        this.$importation.find("div.foot a.ok").hide();
      } else {
        this.$importation.find("div.foot a.ok")
          .removeClass(actions.ok.removeClasses)
          .addClass(actions.ok.addClasses)
          .text(actions.ok.text).hide();
      }

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
        imp.unbind();
        // Sync user model due to user has created a new table
          // and remaining quota has to be updated
        self.user.fetch();
        self.hide();
        self.ok && self.ok(imp.get("table_name"));
      },this);
      imp.bind("importError", function(e){
        self._showError(e.attributes.error_code, e.attributes.get_error_text.title, e.attributes.get_error_text.what_about);
      },this);
      imp.bind("importChange", function(m){
        self.$loader.find('p').text(m.get("state") + "...");
      },this);

      imp.pollCheck();

      this.item_queue_id = item.item_queue_id;
    },

    // Create a new table from scratch
    _createTable: function() {
      var self = this;
      var new_table = new cdb.admin.CartoDBTableMetadata();

      new_table.save(null, {
        success: function(lyr) {
          // Sync user model due to user has created a new table
          // and remaining quota has to be updated
          self.user.fetch();
          self.hide();
          self.ok && self.ok(lyr.get('name'));
        },
        error: function(m,e) {
          self._hideLoader();
          try {
            var err =  e && JSON.parse(e.responseText).errors[0];
            self._showError('', err, self._TEXTS.error.default);
          } catch(e) {
            self._showError('99999',self._TEXTS.error.unknown, self._TEXTS.error.default);
          }
        }
      });
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

    _showUpgrade: function() {
      window.location = window.location.protocol + '//' + config.account_host + "/account/" + this.user.get('username') + "/upgrade?utm_source=Sync_Tables_Suggestion&utm_medium=referral&utm_campaign=Upgrade_from_Importing_URL&utm_content=upgrade"
    },

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
          if (option == 'scratch') {
            // Change dialog state
            this._changeState("creating");
            // Create table
            this._createTable();
          } else if (option == 'file') {
            var pane = this.upload_panes.activePane;
            pane.submitUpload();
          } else if (option == 'tables' && this.table_selection.get('table')) {
            this.ok && this.ok(this.table_selection.get('table'));
            this.hide();
          }
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
      // Destroy tipsys
      this.$('a.radiobutton.disabled')
        .unbind('mouseenter mouseleave')
        .tipsy('remove');

      // Destroy fileupload
      this.$upload.fileupload("destroy");

      // Remove keydown binding
      $(document).unbind('keydown', this._keydown);

      // Cancel upload in case there is one active
      if (this.jqXHR) this._onUploadAbort();

      cdb.ui.common.Dialog.prototype.clean.call(this);
    }
  });
