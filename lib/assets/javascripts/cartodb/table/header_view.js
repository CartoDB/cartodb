
/**
 * header cell view, manages operations on table columns
 */

(function() {

var HeaderView = cdb.admin.HeaderView = cdb.core.View.extend({

  events: {
    'click    .coloptions':     'showColumnOptions',
    'click    .coltype':        'showColumnTypeOptions',
    'keydown  .col_name_edit':  '_checkEditColnameInput',
    'focusout input':           '_finishEdit' 
  },

  initialize: function() {
    var self = this;
    this.column = this.options.column;
    this.table = this.options.table;
    this.template = this.getTemplate('table/views/table_header_view');
    this.editing_name = false;
    this.changing_type = false;

    if (HeaderView.colOptions === undefined) {
      HeaderView.colOptions= new cdb.admin.HeaderDropdown({
        position: 'position',
        horizontal_position: "left",
        tick: "left",
        template_base: "table/views/table_header_options",
        sqlView: this.options.sqlView
      });
      HeaderView.colOptions.render();

      cdb.god.bind("closeDialogs", HeaderView.colOptions.hide, HeaderView.colOptions);
    }

    if (HeaderView.colTypeOptions === undefined) {
      HeaderView.colTypeOptions= new cdb.admin.ColumntypeDropdown({
        position: 'position',
        horizontal_position: "left",
        tick: "left",
        template_base: "table/views/table_column_type_options"
      });
      HeaderView.colTypeOptions.render();
      cdb.god.bind("closeDialogs", HeaderView.colTypeOptions.hide, HeaderView.colTypeOptions);
    }

  },

  render: function() {
    this.$el.html('');

    this.$el.append(this.template({
      col_name: this.column[0],
      col_type: this.column[1],
      editing_name: this.editing_name,
      changing_type: this.changing_type
    }));

    // Focus in the input if it is being edited
    if (this.editing_name) {
      this.$el.find("input").focus();
    }

    this.delegateEvents();

    return this;
  },

  _openColOptions: function(e) {
    var self = this;
    var colOptions = HeaderView.colOptions;
    
    // Unbind events
    colOptions.off();
    cdb.god.unbind('closeDialogs', HeaderView.colOptions.hide, HeaderView.colOptions);

    // Close other dialogs
    cdb.god.trigger("closeDialogs");

    // set data for column and table currently editing
    colOptions.setTable(this.table, this.column[0]);

    colOptions.bind('renameColumn', this._renameColumn, this);
    colOptions.bind('changeType', this._changeType, this);
    colOptions.bind('georeference', function(column) {
        self.trigger('georeference', column);
    }, this);

    // bind the stuff
    var container = $(e.target).parent().parent();
    container.append(colOptions.el);
    var th = container.parent();

    // align to the left of the cell with a little of margin
    colOptions.openAt(10, (th.height()/2) + 7);

    // Bind again!
    cdb.god.bind("closeDialogs", HeaderView.colOptions.hide, HeaderView.colOptions);
  },

  _openColTypeOptions: function(e) {
    if(this.table.data().isReadOnly()) {
      return;
    }
    var colOptions = HeaderView.colTypeOptions;
    
    // Unbind events
    colOptions.off();
    cdb.god.unbind('closeDialogs', HeaderView.colTypeOptions.hide, HeaderView.colTypeOptions);

    // Close other dialogs
    cdb.god.trigger("closeDialogs");

    // set data for column and table currently editing
    colOptions.setTable(this.table, this.column[0]);

    // bind the stuff
    var container = $(e.target).parent().parent();
    container.append(colOptions.el);
    var th = container.parent();

    // align to the left of the cell with a little of margin
    colOptions.openAt(10 , th.height() - 7);

    // Bind again
    cdb.god.bind("closeDialogs", HeaderView.colTypeOptions.hide, HeaderView.colTypeOptions);
  },

  _checkEditColnameInput: function(e) {
    if(e.keyCode === 13) {
      this._submitEdit();
    }
  },

  _submitEdit: function() {
    this.table.renameColumn(this.column[0], $('.col_name_edit').val());
    this._finishEdit();
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
