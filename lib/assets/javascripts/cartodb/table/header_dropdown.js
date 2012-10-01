
/**
 * dropdown when user clicks on a column name
 */
cdb.admin.HeaderDropdown = cdb.admin.DropdownMenu.extend({

  className: "dropdown border",

  events: {
    'click .asc': 'orderColumnsAsc',
    'click .desc': 'orderColumnsDesc',
    'click .rename_column': 'renameColumn',
    'click .change_data_type': 'changeType',
    'click .georeference': 'georeference',
    'click .filter_by_this_column': 'filterColumn',
    'click .delete_column': 'deleteColumn',
    'click .add_new_column': 'addColumn'
  },

  initialize: function() {
    this.options.reserved_column = false;
    this.constructor.__super__.initialize.apply(this);
  },

  setTable: function(table, column) {
    this.table = table;
    this.column = column;


    // depending on column type (reserved, normal) some fields should not be shown
    // so render the dropdown again
    this.options.reserved_column = this.table.data().isReadOnly() || this.table.isReservedColumn(column);
    this.render();

    this.$('.asc').removeClass('selected');
    this.$('.desc').removeClass('selected');
    //set options for ordering
    if(table.data().options.get('order_by') === column) {
      if(table.data().options.get('mode') === 'asc') {
        this.$('.asc').addClass('selected');
      } else {
        this.$('.desc').addClass('selected');
      }
    }
  },

  orderColumnsAsc: function(e) { 
    e.preventDefault();
    this.table.data().setOptions({
      mode: 'asc',
      order_by: this.column
    });
    this.hide();
    return false;
  },

  orderColumnsDesc: function(e) { 
    e.preventDefault();
    this.table.data().setOptions({
      mode: 'des',
      order_by: this.column
    });
    this.hide();
    return false;
  },

  renameColumn: function(e) {
    e.preventDefault();
    this.hide();
    this.trigger('renameColumn');
    return false;
  },

  changeType: function(e) { 
    e.preventDefault();
    this.hide();
    this.trigger('changeType');
    return false;
  },

  georeference: function(e) { },

  filterColumn: function(e) { 
    var dlg = new cdb.admin.FilterColumnDialog({
      table: this.table,
      column: this.column,
      sqlView: this.options.sqlView
    });

    $('body').append(dlg.render().el);
    this.hide();
    dlg.show();
    e.preventDefault();
  },

  deleteColumn: function(e) {
    e.preventDefault();
    cdb.log.debug("removing column: " + this.column);
    this.hide();
    this.table.deleteColumn(this.column);
    return false;
  },

  addColumn: function(e) {
    e.preventDefault();
    var dlg = new cdb.admin.NewColumnDialog({
      table: this.table
    });
    $('body').append(dlg.render().el);
    this.hide();
    dlg.show();
    return false;
  }
});

