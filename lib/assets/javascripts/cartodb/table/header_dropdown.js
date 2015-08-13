
/**
 * dropdown when user clicks on a column name
 */
cdb.admin.HeaderDropdown = cdb.admin.DropdownMenu.extend({

  className: "dropdown border",
  isPublic: false,

  events: {
    'click .asc':                   'orderColumnsAsc',
    'click .desc':                  'orderColumnsDesc',
    'click .rename_column':         'renameColumn',
    'click .change_data_type':      'changeType',
    'click .georeference':          'georeference',
    'click .clearview':             'clearView',
    'click .filter_by_this_column': 'filterColumn',
    'click .delete_column':         'deleteColumn',
    'click .add_new_column':        'addColumn'
  },

  initialize: function() {
    this.options.reserved_column = false;
    this.options.read_only = false;
    this.options.in_sql_view = false;
    this.options.isPublic = this.isPublic;
    this.elder('initialize');
  },

  render: function() {
    cdb.admin.DropdownMenu.prototype.render.call(this);
    // Add the class public if it is reserved column or query applied
    this.$el[this.options.isPublic !== true || this.options.read_only ? 'addClass' : 'removeClass']('public');

    return this;
  },

  setTable: function(table, column) {
    this.table = table;
    this.column = column;

    // depending on column type (reserved, normal) some fields should not be shown
    // so render the dropdown again
    this.options.reserved_column = this.table.isReadOnly() || this.table.isReservedColumn(column);
    this.options.read_only = this.table.isReadOnly();
    this.options.in_sql_view = this.table.isInSQLView();
    this.render();

    this.$('.asc').removeClass('selected');
    this.$('.desc').removeClass('selected');
    //set options for ordering
    if(table.data().options.get('order_by') === column) {
      if(table.data().options.get('sort_order') === 'asc') {
        this.$('.asc').addClass('selected');
      } else {
        this.$('.desc').addClass('selected');
      }
    }
  },

  orderColumnsAsc: function(e) {
    e.preventDefault();
    this.table.data().setOptions({
      sort_order: 'asc',
      order_by: this.column
    });
    this.hide();
    return false;
  },

  orderColumnsDesc: function(e) {
    e.preventDefault();
    this.table.data().setOptions({
      sort_order: 'desc',
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

  clearView: function(e) {
    if (e) e.preventDefault();
    this.hide();
    this.trigger('clearView');
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

    var column_type = this.table._columnType[this.column];

    if ((column_type == 'boolean' || column_type == 'string' || column_type == 'number' || column_type == 'date') && this.column != 'cartodb_id') this._addFilter(this.column);
    else this._showFilterDialog();

  },

  _addFilter: function(column_name) {
    this.trigger('applyFilter', column_name);
    this.hide();
  },

  _showFilterDialog: function() {
    var self = this;
    var dlg = new cdb.admin.FilterColumnDialog({
      table: this.table,
      column: this.column,
      ok: function(filter) {
        self.trigger('applyFilter', self.column);
      }
    });

    $('body').append(dlg.render().el);
    this.hide();
    dlg.open();
  },

  deleteColumn: function(e) {
    e.preventDefault();
    this.hide();

    var view = new cdb.editor.DeleteColumnView({
      clean_on_hide: true,
      enter_to_confirm: true,
      table: this.table,
      column: this.column,
      clean_on_hide: true
    });
    view.appendToBody();

    return false;
  },

  addColumn: function(e) {
    e.preventDefault();

    if (this.options.user.featureEnabled('new_modals')) {
      this.trigger("addColumn", this);
    } else {
      var dlg = new cdb.admin.NewColumnDialog({
        table: this.table
      });
      $('body').append(dlg.render().el);
      dlg.open();
    }
    this.hide();
    return false;
  }
});
