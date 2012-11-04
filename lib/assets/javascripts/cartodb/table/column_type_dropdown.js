
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
  initialize: function() {
    _.bindAll(this, 'setColumnTypeChange', 'setString', 'setNumber',
      'setDate', 'setBool');
    this.elder('initialize');
  },

  setTable: function(table, column) {
    this.table = table;
    this.column = column;
  },

  setColumnTypeChange: function(type) {
    var self = this;
    if(this.table.isTypeChangeDestructive(this.column, type)) {
        this.confirmDialog = new cdb.admin.ConfirmTypeChangeDialog();
        $.when(this.confirmDialog.confirm($('body'))).done(function() {
          self.table.changeColumnType(self.column, type);
        }).fail(function() {
          // does nothing
        })
    } else {
      this.table.changeColumnType(this.column, type);
    }
  },

  setString: function(e) {
    this.killEvent(e);
    this.setColumnTypeChange('string');
  },

  setNumber: function(e) {
    this.killEvent(e);
    this.setColumnTypeChange('number');
  },

  setDate: function(e) {
    this.killEvent(e);
    this.setColumnTypeChange('date');
  },

  setBool: function(e) {
    this.killEvent(e);
    this.setColumnTypeChange('boolean');
  }

});
