
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
    'click .add_new_column': 'addColumn',
    'click .alias_column': 'renameAlias',
    'click .save_column_alias': 'saveAliasInput',
    'click .editAlias': 'renameAlias',
    'click .removeAlias': 'removeAlias',
    'keydown #aliasInput ': '_checkEditColAliasInput',
    'click #aliasInput': '_aliasInputClick'
  },

  initialize: function () {
    this.options.reserved_column = false;
    this.options.read_only = false;
    this.options.in_sql_view = false;
    this.options.columnAlias = null;
    this.options.columnAliasEdit = false;
    this.options.isPublic = this.isPublic;
    this.elder('initialize');
  },

  render: function () {
    cdb.admin.DropdownMenu.prototype.render.call(this);
    // Add the class public if it is reserved column or query applied
    this.$el[this.options.isPublic !== true || this.options.read_only ? 'addClass' : 'removeClass']('public');

    if (this.options.columnAliasEdit) {
      this.$el.find('input').focus();
    }

    return this;
  },

  setTable: function (table, column, alias) {
    this.table = table;
    this.column = column;
    if (column !== alias) {
      this.options.columnAlias = alias;
    } else {
      this.options.columnAlias = null;
    }
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
  hide: function (done) {
    // don't attempt to hide the dropdown if it's already hidden
    if (!this.isOpen) { done && done(); return; }

    this.options.columnAliasEdit = false;

    var self = this;
    this.isOpen = false;
    this.$el.animate({
      marginTop: self.options.vertical_position === 'down' ? '10px' : '-10px',
      opacity: 0
    }, this.options.speedOut, function () {
      // Remove selected class
      $(self.options.target).removeClass('selected');

      // And hide it
      self.$el.hide();
      done && done();

      self.trigger('onDropdownHidden', self.el);
    });
  },

  saveAliasInput: function (e) {
    if (e) e.preventDefault();
    this.trigger('renameAlias', this.column, $('#aliasInput').val());
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

  _aliasInputClick: function (e) {
    e.preventDefault();
    this.killEvent(e);
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
    this._addFilter(this.column);
  },

  _addFilter: function(column_name) {
    this.trigger('applyFilter', column_name);
    this.hide();
  },

  deleteColumn: function(e) {
    e.preventDefault();
    this.hide();

    var view = new cdb.editor.DeleteColumnView({
      clean_on_hide: true,
      enter_to_confirm: true,
      table: this.table,
      column: this.column
    });
    view.appendToBody();

    return false;
  },

  addColumn: function(e) {
    e.preventDefault();
    this.trigger("addColumn", this);
    this.hide();
    return false;
  },

  renameAlias: function (e) {
    e.preventDefault();
    this.options.columnAliasEdit = true;
    this.render();
    return false;
  },

  removeAlias: function (e) {
    if (e) { e.preventDefault(); }
    this.trigger('renameAlias', this.column, null);
    return false;
  },

  _checkEditColAliasInput: function (e) {
    if (e.keyCode === 13) {
      this.saveAliasInput();
    }
    if (e.keyCode === 27) {
      this.hide();
    }
  }
});
