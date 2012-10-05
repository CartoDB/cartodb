
/**
 * view for dropdown show when user click on row options
 */
cdb.admin.RowHeaderDropdown = cdb.admin.DropdownMenu.extend({

  className: 'dropdown border',

  events: {
    'click .delete_row': 'deleteRow',
    'click .add_row': 'addRow'
  },

  initialize: function(options) {
    this.tableData = options.tableData;
    this.elder('initialize');
  },

  setRow: function(row) {
    this.row = row;
  },

  deleteRow: function(e) {
    this.killEvent(e);
    this.trigger('destroyRow');
    this.row.destroy();

    this.hide();

    return false;
  },

  addRow: function(e) {
    this.killEvent(e);
    var rowIndex = this.row.collection.indexOf(this.row);

    this.tableData.addRow({ at: rowIndex + 1 });
    this.hide();
    return false;
  }

});
