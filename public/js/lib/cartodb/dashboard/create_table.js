


(function() {

  /**
   * Mamufas drag
   */
  // var MamufasDrag = cdb.core.View.extend({

  //   events: {
  //     'drop div.mask'       : '_onDrop',
  //     'dragenter'           : '_onEnter',
  //     'dragover div.mask'   : '_onDragover',
  //     'dragleave div.mask'  : '_onLeave'
  //   },

  //   initialize: function() {
  //     _.bindAll(this, "_onEnter", "_onLeave", "_onDrop");
  //     console.log(this.$el[0].document);
  //     var drag_mamufas = this.$drag_mamufas = $(this.$el[0].document).find("div.drag_mamufas");
  //     this.active = true;
  //   },

  //   _onDragover: function(ev) {},

  //   _onEnter: function(ev) {
  //     console.log("enter");
  //     if (this.active)
  //       this.$drag_mamufas.show();
  //   },

  //   _onLeave: function(e) {
  //     console.log("leave");
  //     if (this.active)
  //       this.$drag_mamufas.hide();
  //   },

  //   _onDrop: function(ev) {
  //     console.log("drop");
  //     // ev.stopPropagation();
  //     // ev.preventDefault();
  //     if (this.active) {
  //       this.$drag_mamufas.hide();
  //       this.trigger("fileDropped", ev.originalEvent.dataTransfer, this);
  //     }
  //     return false;
  //   },

  //   enable: function() {
  //     this.active = true;
  //   },

  //   disable: function() {
  //     this.active = false;
  //   }
  // });



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

      // If any change happened in the tables model, fetch the user stats
      this.options.tables.bind('add',     this._tableChange, this);
      this.options.tables.bind('remove',  this._tableChange, this);
      this.options.tables.bind('reset',   this._tableChange, this);

      // Any change, render this view
      this.model.bind('change', this.render, this);

      // Bind big mamufas upload
      //var self = this;
      // this.drag = new MamufasDrag({
      //   el: window
      // }).on("fileDropped", function(data) {
      //   self._showDialog(null,data)
      // })


      // var $upload = this.$el.find("div.drag_mamufas");
      // $upload.bind("inventada", function(ev) {
      //   console.log(ev);
      // });

      // var uploader = this.uploader = new qq.FileUploader({
      //     element: $upload[0],
      //     action: '/api/v1/uploads',
      //     sizeLimit: 0, // max size   
      //     minSizeLimit: 0, // min size
      //     onSubmit: function(ev,id) {
      //       //self._showDialog(null,id);
      //       return false;
      //     }
      //   })

        

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
    _showDialog: function(ev,files) {

      //this.drag.disable();      

      if (!this.active) return false;

      if (ev) ev.preventDefault();
    
      // Create a new dialog
      var dialog = new cdb.admin.CreateTableDialog({
        tables : this.options.tables,
        drop: files
      });

      this.$el.append(dialog.render().el);
      dialog.open();

      var self = this;
      dialog
        .bind('importStarted', this._importStarted, this)
        .bind('closedDialog', function() {
          //self.drag.enable();
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
