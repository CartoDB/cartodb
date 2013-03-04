
/**
 *  Header table view options menu
 *  
 *  It needs a visualization model + account config data.
 */


cdb.admin.HeaderOptionsMenu = cdb.admin.DropdownMenu.extend({
  events: {
    'click .export':        '_export',
    'click .duplicate':     '_duplicate',
    'click .append':        '_append',
    'click .delete_table':  '_delete',
    'click .georeference':  '_georeference',
    'click .merge_tables':  '_mergeTables'
  },

  show: function() {
    this.render();
    this.constructor.__super__.show.apply(this);
  },

  _export: function(e){
    e.preventDefault();

    // Should check if query is applied and it is correct, if not, user can't
    // export anything...
    if (this.options.table.isInSQLView()) {
      return;
    }

    var export_dialog = new cdb.admin.ExportTableDialog({
      model: this.options.table,
      config: config,
      user_data: user_data
    });

    export_dialog
      .appendToBody()
      .open();
  },

  _duplicate: function(e){
    e.preventDefault();

    // Should check if query is applied and it is correct, if not, user can't
    // duplicate a table or a query...
    if (this.options.table.isInSQLView()) {
      return;
    }

    var duplicate_dialog = new cdb.admin.DuplicateTable({
      model: this.options.table
    });

    duplicate_dialog
      .appendToBody()
      .open();
  },

  _append: function(e){
    e.preventDefault();
  },

  _delete: function(e){
    e.preventDefault();

    this.delete_dialog = new cdb.admin.DeleteDialog({
      model: this.options.table,
      config: config,
      user_data: user_data,
    });
    $("body").append(this.delete_dialog.render().el);
    this.delete_dialog.open();

    this.delete_dialog.wait()
      .done(this.deleteTable.bind(this));
  },

  _mergeTables: function(e) { // TODO: set prior state
    e.preventDefault();

    var mergeDialog = new cdb.admin.MergeTablesDialog({
      table: this.options.table
    });

    mergeDialog
      .appendToBody()
      .open({ center:true });
  },

  _georeference: function(e) {
    e.preventDefault();
    var geoDialog = new cdb.admin.GeoreferenceDialog({
      model: this.options.table,
      geocoder: this.options.geocoder
    });
    geoDialog
      .appendToBody()
      .open({ center:true });
  }

});