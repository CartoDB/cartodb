
/**
 * dropdown to select the column type when user clicks
 * on the type
 */
cdb.admin.ColumntypeDropdown = cdb.admin.DropdownMenu.extend({ 

  className: 'dropdown border',

  events: {
    'click .string': 'setString',
    'click .number': 'setNumber',
    'click .date': 'setDate',
    'click .bool': 'setBool'
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
  },

  setBool: function(e) {
    e.preventDefault();
    this.table.changeColumnType(this.column, 'boolean');
  }

});
