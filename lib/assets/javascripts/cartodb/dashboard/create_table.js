


(function() {

  /**
   * Mamufas drag for the dashboard
   */
  var MamufasDrag = cdb.core.View.extend({

    initialize: function() {
      var self = this;

      _.bindAll(this, "_onDrop", "_onDragOver", "_onDragStart", "_onMouseLeave", "enable", "disable");

      this.$upload = this.$el;
      this.inside_drop = false;

      $(document).bind("dragstart", function(ev){ self.inside_drop = true });
      $(document).bind("mouseleave mouseout dragexit", this._onMouseLeave);

      this.$upload.fileupload({
        drop: this._onDrop,
        dragover: this._onDragOver
      });
    },

    _onDrop: function(ev,files_obj) {
      this.inside_drop = false;
      if (files_obj.files.length > 0) {
        this.trigger("drop",ev,files_obj);
      }
      this.$upload.fadeOut('fast');
    },

    _onDragStart: function() {
      this.inside_drop = true ;
    },

    _onDragOver: function(ev) {
      if (!this.inside_drop) {
        this.$upload.fadeIn('fast');
      }
    },

    _onMouseLeave: function() {
      this.inside_drop = false;
      this.$upload.fadeOut('fast');
    },

    enable: function() {
      this.$upload.fileupload("enable")
    },

    disable: function() {
      this.$upload.fileupload('disable');
    }
  });



  /**
   * Create a new table view
   */
  var CreateTable = cdb.core.View.extend({

    events: {
      'click a.create_new':     '_showDialog',
      'click a.import_example': '_importExample',
      'click aside ul li a.popular': '_showPopular'
    },

    initialize: function() {
      this.importer = this.options.importer;

      // Set default to active
      this.active = true;

      // Any change, render this view
      this.model.bind('change', this.render, this);

      // Big mamufas upload
      var self = this;
      this.mamufasDrag = new MamufasDrag({
        el: this.$("div.drag_mamufas")
      }).on("drop", function(ev,files_obj) {
        self._showDialog(ev,files_obj.files)
      })

      this.render();
    },


    render: function() {
      var attrs = this.model.toJSON();

      // Check tables count quota status
      if (((((attrs.table_count / attrs.table_quota) * 100) >= 100)
          || ((((attrs.byte_quota - attrs.remaining_byte_quota) / attrs.byte_quota) * 100) >= 100))
          && attrs.byte_quota != null && attrs.byte_quota != 0
          && attrs.table_quota != null && attrs.table_quota != 0) {
        this._disableCreate();
      } else {
        this._activateCreate();
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
      this.$el.find("a.create_new, a.popular").addClass("grey disabled");
    },


    /**
     * Import examples data
     */
    _importExample: function(ev) {
    console.log('importing');
      ev.preventDefault();
      var url = $(ev.target).attr("href");

      this._showDialog(null,null,url);
    },


    /**
     * Show popular list
     */
    _showPopular: function(ev) {
      ev.preventDefault();

      var attrs = this.model.toJSON();

      // If your table quota or size quota is full, return!
      if (!this.active) {
        // If it is a custom CartoDB install, don't show any upgrade window
        if (this.options.config && !this.options.config.custom_com_hosted)
          this._showUpgrade();
        return false;
      }

      var dialog = new cdb.admin.PopularTagsDialog()
        , self = this;

      this.mamufasDrag.disable();
      this.$el.append(dialog.render().el);

      // Bind any click in the popular tables list
      dialog
        .bind('importExample', function(ev) {
          dialog.simulateHide();
          self._importExample(ev);
        }, this)
        .bind('closedDialog', this.mamufasDrag.enable, this)

      dialog.open();
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
          this._showUpgrade();
        return false;
      }

      this.mamufasDrag.disable();

      // Create a new dialog
      var dialog = new cdb.admin.CreateTableDialog({
        tables : this.options.tables,
        files: files || null,
        url: url || null,
        quota: this.model.get("remaining_byte_quota") * (this.model.get("account_type") != "FREE" ? 3 : 1)
      });

      this.$el.append(dialog.render().el);
      dialog.open();

      dialog
        .bind('importStarted', this._importStarted, this)
        .bind('closedDialog', this.mamufasDrag.enable, this)
    },


    /**
     *  Show upgrade window
     */
    _showUpgrade: function() {
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


    /**
     * Start background import
     */
    _importStarted: function(item_queue_id) {

      // Start importer before first polling arrives
      this.importer.changeState({state: "preprocessing"});

      var self = this
        , imp = new cdb.admin.Import({item_queue_id: item_queue_id});

      imp.bind("importComplete", function(e){
        cdb.log.info("updating tables");
        $.when(self.options.tables.fetch()).done(function() {
          self.options.tables.trigger('sync');
        }).fail(function(){
          self.options.tables.trigger('loadFailed');
        });

        setTimeout(self.importer.hide, 3000);
        imp.unbind();
      },this).bind("importError", function(e){
        cdb.log.info(e);
        // Show error link to open a new error dialog :)
      },this).bind('change:state', function(i) {
        self.importer.changeState(i.toJSON());
      },this).bind('change:success', function(i) {
        self.importer.changeState(i.toJSON());
      }, this);

      imp.pollCheck();
    },

  });

  cdb.admin.dashboard.CreateTable = CreateTable;
})();
