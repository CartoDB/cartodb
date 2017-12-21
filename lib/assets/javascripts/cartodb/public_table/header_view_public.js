
/**
 * header cell view, manages operations on table columns
 */

(function() {

HeaderView = cdb.open.PublicHeaderView = cdb.admin.HeaderView.extend({

  events: {
  },

  initialize: function() {
    var self = this;
    this.column = this.options.column;
    this.table = this.options.table;
    this.template = this.getTemplate('public_table/views/public_table_header_view');
    this.editing_name = false;
    this.changing_type = false;
  },

  render: function() {
    this.$el.html('');
    this.$el.append(this.template({
      col_name: this.column[0],
      col_type: this.column[1],
      editing_name: this.editing_name,
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
    
    var link_width  = $(e.target).width() + 26
      , th          = container.parent();

    // align to the right of the target with a little of margin
    colOptions.openAt(link_width - colOptions.$el.width(), (th.height()/2) + 7);

    // Bind again!
    cdb.god.bind("closeDialogs", HeaderView.colOptions.hide, HeaderView.colOptions);

  },

  _openColTypeOptions: function(e) {},

  _checkEditColnameInput: function(e) {},

  _submitEdit: function() {},

  _finishEdit: function() {},

  _renameColumn: function() {},

  _changeType: function() {},

  showColumnOptions: function(e) {
    var self = this;
    e.preventDefault();
    var colOptions = HeaderView.colOptions;
    colOptions.hide(function() {
      self._openColOptions(e);
    });
    return false;
  },

  showColumnTypeOptions: function(e) {}

});

})();
