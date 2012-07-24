/**
 * User stats embeded in the dashboard
 *
 * It shows the tables and the space used in the user account
 * You must set the username, the user id and the tables model,
 * if not, it won't work.
 *
 * usage example:
 *
 *    this.tableStats = new cdb.admin.dashboard.TableStats({
 *      el: this.$('div.subheader'),
 *      username: "admin",
 *      userid: 1,
 *      tables: tables.model
 *    })
 *
 *
 * TODO:
 *  - Animate progress colors (not possible with gradients)
 *  - Animate numbers from the beginning
*/

cdb.admin.dashboard = cdb.admin.dashboard || {};


(function() {

  /**
   * Create a new table view
   */
  var CreateTable = cdb.core.View.extend({

    events: {
      'click a[href=#create_new]':  '_showDialog'
    },

    initialize: function() {
      this.importer = this.options.importer;

      // Set default to active
      this.active = true;

      // If any change happened in the tables model, fetch the user stats
      this.options.tables.bind('add',     this._tableChange, this);
      this.options.tables.bind('remove',  this._tableChange, this);
      this.options.tables.bind('reset',   this._tableChange, this);

      // Any change, render this view
      this.model.bind('change', this.render, this);
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
    _showDialog: function(ev) {

      if (!this.active) return false;

      ev.preventDefault();
      var dialog = new cdb.admin.CreateTableDialog();
      this.$el.append(dialog.render().el);
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