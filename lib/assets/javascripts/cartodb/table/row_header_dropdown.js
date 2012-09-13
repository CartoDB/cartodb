
/**
 * view for dropdown show when user click on row options
 */
cdb.admin.RowHeaderDropdown = cdb.admin.DropdownMenu.extend({

  className: 'dropdown border',

  events: {
    'click .delete_row': 'deleteRow',
    'click .add_row': 'addRow'
  },

  setRow: function(row) {
    this.row = row;
  },

  deleteRow: function(e) {
    e.preventDefault();
    this.row.destroy();
    this.hide();
    return false;
  },

  addRow: function(e) {
    e.preventDefault();
    var rowIndex = this.row.collection.indexOf(this.row);
    this.options.tableData.addRow({ at: rowIndex + 1 });
    this.hide();
    return false;
  }

});
