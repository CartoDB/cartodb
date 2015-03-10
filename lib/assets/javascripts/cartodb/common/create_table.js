  /**
   * Create a new table view
   */

  cdb.admin.CreateTable = cdb.core.View.extend({

    initialize: function() {
      this.importer = this.options.importer;
      this.router = this.options.router;

      // Set default to active
      this.active = true;

      // Any change, render this view
      this.model.bind('change', this.render, this);

      // Big mamufas upload
      var self = this;
      this.mamufasDrag = new cdb.admin.MamufasDrag({
        el: this.$("div.drag_mamufas")
      }).on("drop", function(ev,files_obj) {
        self._showDialog(ev,files_obj.files)
      });

      this.addView(this.mamufasDrag);

      this.render();
    },


    render: function() {
      if (
        // Check table quota
        ( this.model.get('table_quota') === null || this.model.get('remaining_table_quota') > 0 )
        &&
        // Check bytes quota
        ( this.model.get('quota_in_bytes') === null || this.model.get('remaining_byte_quota') > 0 )
      ) {
        this._activateCreate();
      } else {
        this._disableCreate();
      }

      return this;
    },


    /**
     * If there is any table change
     */
    _tableChange: function() {
      this.model.fetch();
    },


    /**
     * Activate create button
     */
    _activateCreate: function() {
      this.active = true;
      this.$el.find("a.create_new, a.popular").removeClass("grey disabled");
    },


    /**
     * Disable create button
     */
    _disableCreate: function() {
      this.active = false;

      this.$el.find(".tables a.create_new, a.popular").addClass("grey disabled");
    },


    /**
     * Import examples data
     */
    importExample: function(ev) {
      ev.preventDefault();
      var url = $(ev.target).attr("href");
      cdb.god.trigger('mixpanel', "Importing a common data example", { url: url });
      this._showDialog(null,null,url);
    },


    /**
     * Show import/create dialog or
     */
    _showDialog: function(ev,files,url) {
      if (ev) ev.preventDefault();

      // If view is not active, don't show the dialog
      if (!this.active) {
        // If it is a custom CartoDB install, don't show any upgrade window
        if (this.options.config && !this.options.config.custom_com_hosted)
          this.showUpgrade();
        return false;
      }

      this.mamufasDrag.disable();

      // Any file or url included?
      var d = {}
      if (files) d.files = files;
      if (url) d.url = url;
      
      // New dialog
      var dialog = new cdb.common.CreateDialog({
        user:   this.model,
        data:   d,
        tabs:   ['file', 'gdrive', 'dropbox', 'twitter', 'scratch', 'arcgis', 'salesforce', 'mailchimp', /*'instagram',*/ 'success', 'error'],
        option: 'file',
        where:  'table'
      })

      this.$el.append(dialog.render().el);
      dialog.open({ center: true });

      dialog
        .bind('importStarted',    this._importStarted, this)
        .bind('importCompleted',  this._importCompleted, this)
        .bind('importDone',       this._importDone, this)
        .bind('closedDialog',     this.mamufasDrag.enable, this)
        .bind('showUpgrade',      this.showUpgrade, this);
    },


    /**
     *  Show upgrade window
     */
    showUpgrade: function() {
      var dialog = new cdb.admin.UpgradeDialog({
            model: this.model,
            config: this.options.config
          })
        , self = this;

      this.mamufasDrag.disable();
      this.$el.append(dialog.render().el);

      // Bind any click in the popular tables list
      dialog.bind('closedDialog', this.mamufasDrag.enable, this)

      dialog.open();
    },

    _importDone: function(imp, dlg) {
      window.location.href = cdb.config.prefixUrl() + "/tables/" + imp.table_name + "/";
    },

    _importCompleted: function(imp, dlg) {
      // From Twitter search?
      if (imp.service_name === "twitter_search") {
        // Refresh tables
        this._refreshTables();
        // Refresh user model
        this.model.fetch();
        return false;
      }
      
      // From other import
      if (imp.any_table_raster || ( imp.tables_created_count && imp.tables_created_count > 1 )) {
        this._refreshTables();
        this.model.fetch();
      } else {
        this._importDone(imp, dlg);
      }

      dlg.hide();
    },


    /**
     * Start background import
     */
    _importStarted: function(upload, dlg) {
      dlg.hide();

      // Start importer before first polling arrives
      this.importer.changeState({ state: "preprocessing" });

      var self = this;
      var imp = new cdb.admin.Import({ item_queue_id: upload.item_queue_id });

      cdb.god.trigger('mixpanel', "Import started");
      
      imp
        // On complete
        .bind("importComplete", function(e){
          // Refresh tables
          this._refreshTables();
          // Hide importer
          setTimeout(self.importer.hide, 3000);
          imp.unbind();
        },this)

        // On error
        .bind("importError", function(e){
          cdb.log.info(e);
          // Show error link to open a new error dialog :)
          cdb.god.trigger('mixpanel', "Import failed");
        },this)

        // State change
        .bind('change:state', function(i) {
          self.importer.changeState(i.toJSON());
        },this)

        // On success
        .bind('change:success', function(i) {
          self.importer.changeState(i.toJSON());
        }, this);

      // Start polling
      imp.pollCheck();

      this.add_related_model(imp);
    },

    _refreshTables: function() {
      // Refresh tables
      var storage = new cdb.admin.localStorage(this.router.model.get('model') + '.sortable');
      var order_obj = {};
      order_obj[storage.get("order") || 'updated_at'] = 'desc';
      this.options.tables && this.options.tables.fetch({ data: { o: order_obj } });
    }

  });

