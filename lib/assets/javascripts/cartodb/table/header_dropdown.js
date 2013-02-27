
/**
 * dropdown when user clicks on a column name
 */
cdb.admin.HeaderDropdown = cdb.admin.DropdownMenu.extend({

  className: "dropdown border",
  isPublic: false,

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
    this.options.isPublic = this.isPublic;
    this.elder('initialize');
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
    this.trigger('changeType', this.column);
    return false;
  },

  georeference: function(e) {
    e.preventDefault();
    this.trigger('georeference', this.column);
    this.hide();
    return false;
  },

  filterColumn: function(e) {
    this.killEvent(e);

    var self = this;
    var dlg = new cdb.admin.FilterColumnDialog({
      table: this.table,
      column: this.column,
      ok: function(filter) {
        self.trigger('applyFilter', self.column, filter);
      }
    });

    $('body').append(dlg.render().el);
    this.hide();
    dlg.open();
  },

  deleteColumn: function(e) {
    e.preventDefault();
    var self = this;
    this.hide();

    var delete_confirmation = new cdb.admin.BaseDialog({
      title: "Delete " + self.column + " column",
      description: "Are you sure you want to delete this column and all its associated data?",
      template_name: 'common/views/confirm_dialog',
      clean_on_hide: true,
      enter_to_confirm: true,
      ok_button_classes: "right button grey",
      ok_title: "Yes, do it",
      cancel_button_classes: "underline margin15",
      cancel_title: "Cancel",
      modal_type: "confirmation",
      width: 500
    });

    // If user confirms, app removes the row
    delete_confirmation.ok = function() {
      self.table.deleteColumn(self.column)
    }

    delete_confirmation
      .appendToBody()
      .open();

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

