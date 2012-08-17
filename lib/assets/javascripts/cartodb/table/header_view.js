
/**
 * header cell view, manages operations on table columns
 */

(function() {

var HeaderView = cdb.admin.HeaderView = cdb.core.View.extend({

  events: {
    'click    .coloptions':      'showColumnOptions',
    'click    .coltype':         'showColumnTypeOptions',
    'keydown  .col_name_edit':   '_checkEditColnameInput'
  },

  initialize: function() {
    this.column = this.options.column;
    this.table = this.options.table;
    this.template = this.getTemplate('table/views/table_header_view');
    this.editing_name = false;
    this.changing_type = false;

    HeaderView.colOptions= new cdb.admin.HeaderDropdown({
      position: 'position',
      horizontal_position: "left",
      tick: "right",
      template_base: "table/views/table_header_options"
    });
    HeaderView.colOptions.render();

    HeaderView.colTypeOptions= new cdb.admin.ColumntypeDropdown({
      position: 'position',
      horizontal_position: "left",
      tick: "right",
      template_base: "table/views/table_column_type_options"
    });
    HeaderView.colTypeOptions.render();

    cdb.god.bind("closeDialogs", HeaderView.colOptions.hide, HeaderView.colOptions);
    cdb.god.bind("closeDialogs", HeaderView.colTypeOptions.hide, HeaderView.colTypeOptions);
  },

  render: function() {
    this.$el.html('');

    this.$el.append(this.template({
      col_name: this.column[0],
      col_type: this.column[1],
      editing_name: this.editing_name,
      changing_type: this.changing_type
    }));
    return this;
  },

  _openColOptions: function(e) {
    var colOptions = HeaderView.colOptions;
    colOptions.off();

    // set data for column and table currently editing
    colOptions.setTable(this.table, this.column[0]);

    colOptions.bind('renameColumn', this._renameColumn, this);
    colOptions.bind('changeType', this._changeType, this);

    // bind the stuff
    var container = $(e.target).parent().parent();
    container.append(colOptions.el);
    var th = container.parent();

    // align to the right of the cell with a little of margin
    colOptions.openAt(th.width() - colOptions.options.width - 10 , 3*th.height()/4);
  },

  _openColTypeOptions: function(e) {
    if(this.table.data().isReadOnly()) {
      return;
    }
    var colOptions = HeaderView.colTypeOptions;
    colOptions.off();

    // set data for column and table currently editing
    colOptions.setTable(this.table, this.column[0]);

    // bind the stuff
    var container = $(e.target).parent().parent();
    container.append(colOptions.el);
    var th = container.parent();

    // align to the right of the cell with a little of margin
    colOptions.openAt(th.width() - colOptions.options.width - 10 , th.height());
  },

  _checkEditColnameInput: function(e) {
    if(e.keyCode === 13) {
      this.table.renameColumn(this.column[0], $('.col_name_edit').val());
      this.editing_name = false;
      this.render();
    }
  },

  _finishEdit: function() {
    this.editing_name = false;
    this.render();
  },

  _renameColumn: function() {
    this.editing_name = true;
    this.changing_type = false;
    this.render();
  },

  _changeType: function() {
    this.editing_name = false;
    this.changing_type = true;
    this.render();
  },

  showColumnOptions: function(e) {
    var self = this;
    e.preventDefault();
    var colOptions = HeaderView.colOptions;
    colOptions.hide(function() {
      self._openColOptions(e);
    });
    return false;
  },

  showColumnTypeOptions: function(e) {
    var self = this;
    e.preventDefault();
    var colOptions = HeaderView.colTypeOptions;
    colOptions.hide(function() {
      self._openColTypeOptions(e);
    });
    return false;
  }

});

})();
