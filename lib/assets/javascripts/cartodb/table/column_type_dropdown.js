
/**
 * dropdown to select the column type when user clicks
 * on the type
 */
cdb.admin.ColumntypeDropdown = cdb.admin.UserMenu.extend({ 
  events: {
    'click .string': 'setString',
    'click .number': 'setNumber',
    'click .date': 'setDate'
  },

  setTable: function(table, column) {
    this.table = table;
    this.column = column;
  },

  setString: function(e) {
    e.preventDefault();
    this.table.changeColumnType(this.column, 'string');
  },

  setNumber: function(e) {
    e.preventDefault();
    this.table.changeColumnType(this.column, 'number');
  },

  setDate: function(e) {
    e.preventDefault();
    this.table.changeColumnType(this.column, 'date');
  }

});
