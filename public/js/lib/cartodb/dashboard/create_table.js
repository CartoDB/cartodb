


(function() {

  /**
   * Mamufas drag
   */
  var MamufasDrag = cdb.core.View.extend({

    events: {
      'drop .drag_mamufas'      : '_onDrop',
      'dragleave .drag_mamufas' : '_onLeave',
      'dragenter .drag_mamufas' : '_onMamufasEnter',
      'dragenter'               : '_onWindowEnter'
    },

    initialize: function() {
      _.bindAll(this, "_onWindowEnter", "_onLeave", "_onDrop");
      var drag_mamufas = this.$drag_mamufas =  this.$("div.drag_mamufas");
    },

    render: function() {

    },

    _onWindowEnter: function(ev) {
      ev.preventDefault();
      ev.stopPropagation();

      this.$drag_mamufas.show();
      console.log("enter body");
    },

    _onMamufasEnter: function(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      console.log("enter mamufas");
    },

    _onLeave: function(ev) {
      ev.preventDefault();
      ev.stopPropagation();

      this.$drag_mamufas.hide();
      console.log("leave");
    },

    _onDrop: function(ev) {
      console.log("drop");
      ev.stopPropagation();
      ev.preventDefault();
      this.$drag_mamufas.hide();
      this.trigger("fileDropped", ev.originalEvent.dataTransfer, this);
    }
  });



  /**
   * Create a new table view
   */
  var CreateTable = cdb.core.View.extend({

    events: {
      'click a#create_new':  '_showDialog'
    },

    initialize: function() {
      this.importer = this.options.importer;

      // Set default to active
      this.active = true;

      /******************/
      //this._showDialog()
      /*******************/

      // If any change happened in the tables model, fetch the user stats
      this.options.tables.bind('add',     this._tableChange, this);
      this.options.tables.bind('remove',  this._tableChange, this);
      this.options.tables.bind('reset',   this._tableChange, this);

      // Any change, render this view
      this.model.bind('change', this.render, this);

      // Bind big mamufas upload
      var self = this;
      this.drag = new MamufasDrag({
        el: document.body
      }).on("fileDropped", function(data) {
        self._showDialog(null,data)
      })

      // var $upload = this.$el.find('div.mamufas_upload')
      //   , self = this
      //   , $uploader = this.big_upload = new qq.FileUploader({
      //     element: $upload[0],
      //     action: '/api/v1/uploads',
      //     sizeLimit: 0, // max size   
      //     minSizeLimit: 0, // min size
      //     onSubmit: function(id,fileName) {
      //       self._showDialog(null,fileName);
      //     }
      //   });
// 570 - fileuploader.js

      
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
     * 
     */
    _showDialog: function(ev,data) {

      if (!this.active) return false;

      if (ev) ev.preventDefault();
    
      // Create a new dialog
      var dialog = new cdb.admin.CreateTableDialog({
        tables : this.options.tables,
        drop: data
      });

      $("body").append(dialog.render().el);
      dialog.open();

      dialog.bind('importStarted', this._importStarted, this);
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
