
/**
 * dropdown to select the column type when user clicks
 * on the type
 */
cdb.admin.ColumntypeDropdown = cdb.admin.DropdownMenu.extend({

  className: 'dropdown border',
  dialogContainer: 'body',

  events: {
    'click .string': 'setString',
    'click .number': 'setNumber',
    'click .date': 'setDate',
    'click .boolean': 'setBool'
  },

  initialize: function() {
    _.bindAll(this, 'setColumnTypeChange', 'setString', 'setNumber', 'setDate', 'setBool');
    this.elder('initialize');
  },

  setTable: function(table, column) {
    var self = this;
    this.table = table;
    this.column = column;
    var type = this.table.getColumnType(column);
    this._disableColumn(type);
    _(["string", "number", "boolean", "date"]).each(function(c) {
      if (!self.table.isTypeChangeAllowed(self.column,c)) {
        self._disableColumn(c, { keep_disabled: true });
      }
    });
  },

  // Disable current selected column
  _disableColumn: function(type, options) {
    options = options || {};
    if(!options.keep_disabled) {
      this.$('li.disabled').removeClass('disabled');
    }
    this.$('li a.' + type).parent().addClass('disabled');
  },

  setColumnTypeChange: function(type) {
    var self = this;
    self.hide();

    if (this.table.isTypeChangeDestructive(this.column, type)) {
      this.change_confirmation = cdb.editor.ViewFactory.createDialogByTemplate('common/dialogs/confirm_type_change', {
        title: "Confirm type change",
        description: "Unconvertible data will be lost. Are you sure?"
      });

      this.change_confirmation.ok = function() {
        self.table.changeColumnType(self.column, type);
        this.close && this.close();
      }

      this.change_confirmation
      .appendToBody()
      .open();
    } else {
      this.table.changeColumnType(this.column, type);
    }
  },

  setString: function(e) {
    this.killEvent(e);
    if (this.table.isTypeChangeAllowed(this.column, 'string'))
      this.setColumnTypeChange('string');
  },

  setNumber: function(e) {
    this.killEvent(e);
    if (this.table.isTypeChangeAllowed(this.column, 'number'))
      this.setColumnTypeChange('number');
  },

  setDate: function(e) {
    this.killEvent(e);
    if (this.table.isTypeChangeAllowed(this.column, 'date'))
      this.setColumnTypeChange('date');
  },

  setBool: function(e) {
    this.killEvent(e);
    if (this.table.isTypeChangeAllowed(this.column, 'boolean'))
      this.setColumnTypeChange('boolean');
  }

});
