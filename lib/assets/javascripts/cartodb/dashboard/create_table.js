


(function() {

  /**
   * Mamufas drag for the dashboard
   */
  var MamufasDrag = cdb.core.View.extend({

    initialize: function() {
      _.bindAll(this, "_onDrop", "_onDragOver", "_onMouseLeave");

      this.$upload = this.$el;
      
      this.$upload.fileupload({
        drop: this._onDrop,
        dragover: this._onDragOver
      });

      $(document).bind("mouseleave", this._onMouseLeave);
    },

    _onDrop: function(ev,files_obj) {
      if (files_obj.files.length > 0) {
        this.$upload.fadeOut('fast');
        this.trigger("drop",ev,files_obj);
      }
    },

    _onDragOver: function(ev) {
      this.$upload.fadeIn('fast');
    },

    _onMouseLeave: function() {
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
      'click a.create_new':  '_showDialog'
    },

    initialize: function() {
      this.importer = this.options.importer;

      // Set default to active
      this.active = true;

      /******************/
      //this._showDialog()
      /*******************/

      // Any change, render this view
      this.model.bind('change', this.render, this);


      // Bind big mamufas upload
      var self = this;
      this.mamufasDrag = new MamufasDrag({
        el: this.$("div.drag_mamufas")
      }).on("drop", function(ev,files_obj) {
        self._showDialog(ev,files_obj.files)
      })
    },

    _tableChange: function() {
      this.model.fetch();
    },

    render: function() {
      var attrs = this.model.attributes;

      // Check tables count quota status
      if ((((attrs.table_count / attrs.table_quota) * 100) >= 100) || 
          ((((attrs.byte_quota - attrs.remaining_byte_quota) / attrs.byte_quota) * 100) >= 100)) {
        this._disableCreate();
      } else {
        this._activateCreate();
      }

      return this;
    },


    _activateCreate: function() {
      this.active = true;
      this.$el.find("a").removeClass("disabled");
    },

    _disableCreate: function() {
      this.active = false;
      this.$el.find("a").addClass("disabled");
    },


    /*
     * Show the create table dialog
     */
    _showDialog: function(ev,files) {
      if (ev) ev.preventDefault();

      this.mamufasDrag.disable();
    
      // Create a new dialog
      var dialog = new cdb.admin.CreateTableDialog({
        tables : this.options.tables,
        files: files || null
      });

      this.$el.append(dialog.render().el);
      dialog.open();

      var self = this;
      dialog
        .bind('importStarted', this._importStarted, this)
        .bind('closedDialog', function() {
          self.mamufasDrag.enable();
        });
    },

    _importStarted: function(imp) {
      //TODO: create dialog to show the import progress
      var self = this;
      imp.pollCheck();

      //TODO: Connect the uploading state
      imp.bind('change:state', function(i) { self.importer.changeState(i.get('state')); }, this);
      imp.bind('importComplete', function(){ 
        cdb.log.info("updating tables");
        self.options.tables.fetch();
        setTimeout(self.importer.hide, 3000);
        imp.unbind();
      });
    },

  });

  cdb.admin.dashboard.CreateTable = CreateTable;
})();
