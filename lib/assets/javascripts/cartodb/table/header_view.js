
/**
 * header cell view, manages operations on table columns
 */

(function() {

var HeaderView = cdb.admin.HeaderView = cdb.core.View.extend({
  
  _TEXTS: {
    no_geo: {
      title:        _t('Georeference your table'),
      description:  _t('This funcionality is not available in the visualization view. \
                    Please, visit <a href="<%- prefix %>/tables/<%- table_name %>">your table</a> and start georeferencing there.'),
      ok:           _t('Ok, close')
    }
  },

  NO_MENU_COLUMNS: ['the_geom', 'the_geom_webmercator'],

  events: {
    'dblclick .coloptions':     '_renameColumn',
    'click    .coloptions':     'showColumnOptions',
    'click    .coltype':        'showColumnTypeOptions',
    'click    .geo':            'showGeoreferenceWindow',
    'keydown  .col_name_edit':  '_checkEditColnameInput',
    'focusout input':           '_finishEdit',
    'click':                    'activateColumnOptions'
  },

  initialize: function() {
    var self = this;
    this.column = this.options.column;
    this.table = this.options.table;
    this.vis = this.options.vis;
    this.template = this.getTemplate('table/views/table_header_view');
    this.editing_name = false;
    this.changing_type = false;

    this.vis.bind('change:type', function() {
      // You can't geocode being in a visualization of type derived
      HeaderView && HeaderView.colTypeOptions.render();
    });

    this.add_related_model(this.vis);

    if (HeaderView.colOptions === undefined) {
      HeaderView.colOptions= new cdb.admin.HeaderDropdown({
        user: this.options.user,
        position: 'position',
        horizontal_position: "right",
        tick: "right",
        template_base: "table/views/table_header_options",
        sqlView: this.options.sqlView,
        vis: this.vis
      });
      HeaderView.colOptions.render();

      cdb.god.bind("closeDialogs", HeaderView.colOptions.hide, HeaderView.colOptions);
    }

    if (HeaderView.colTypeOptions === undefined) {
      HeaderView.colTypeOptions= new cdb.admin.ColumntypeDropdown({
        position: 'position',
        horizontal_position: "right",
        tick: "right",
        template_base: "table/views/table_column_type_options"
      });
      HeaderView.colTypeOptions.render();
      cdb.god.bind("closeDialogs", HeaderView.colTypeOptions.hide, HeaderView.colTypeOptions);
    }
  },

  _addColumn: function(column) {
    table.tableTab.tableView.addColumn(column);
  },

  render: function() {
    this.$el.html('');

    this.$el.append(this.template({
      col_name:         this.column[0],
      col_type:         this.column[1],
      editing_name:     this.editing_name,
      changing_type:    this.changing_type,
      read_only:        this.table.isReadOnly(),
      isReservedColumn: this.table.isReadOnly() || this.table.isReservedColumn(this.column[0]),
      noMenu:           (this.NO_MENU_COLUMNS.indexOf(this.column[0]) >= 0)
    }));

    // Focus in the input if it is being edited
    // and set the correct width
    if (this.editing_name) {
      var w = this.$el.find("p.auto").width();
      this.$el.find("input")
        .css({
          "max-width":  w,
          "width":      w
        })
        .focus();
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

    colOptions.bind('addColumn', this._addColumn, this);
    colOptions.bind('renameColumn', this._renameColumn, this);
    colOptions.bind('changeType', this._changeType, this);
    colOptions.bind('clearView', function(){
      self.trigger('clearView');
    }, this);
    colOptions.bind('georeference', function(column) {
      self.trigger('georeference', column);
    }, this);
    colOptions.bind('applyFilter', function(column) {
      self.trigger('applyFilter', column);
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

  _openColTypeOptions: function(e) {
    if(this.table.isReadOnly()) {
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

    var link_width  = $(e.target).outerWidth() + 24
      , th          = container.parent();

    // align to the right of the target with a little of margin
    colOptions.openAt(link_width - colOptions.$el.width(), (th.height()/2) + 25);


    // Bind again
    cdb.god.bind("closeDialogs", HeaderView.colTypeOptions.hide, HeaderView.colTypeOptions);
  },

  _checkEditColnameInput: function(e) {
    if(e.keyCode === 13) {
      this._submitEdit();
    }
    if(e.keyCode === 27) {
      this._finishEdit();
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

  _renameColumn: function(ev) {
    if (ev) {
      this.killEvent(ev)
    }

    this.editing_name = true;
    this.changing_type = false;
    this.render();
  },

  _changeType: function(column) {
    this.editing_name = false;
    this.changing_type = true;

    // Simulate click
    var $coltype_link = this.$el.find('a.coltype');
    $coltype_link.click();
  },

  activateColumnOptions: function(e) {
    this.killEvent(e);
    this.$el.find("a.coloptions").click();
  },

  showColumnOptions: function(e) {
    var self = this;
    var colOptions = HeaderView.colOptions;
    var columnName = this.column[0];

    e.preventDefault();

    // If submenu was openened before, let's close it.
    if (colOptions.isOpen && columnName == colOptions.column) {
      colOptions.hide(); 
      return false;
    }

    // If submenu is from different column or it is closed.
    if (this.NO_MENU_COLUMNS.indexOf(this.column[0]) < 0) {
      colOptions.hide(function() {
        colOptions.parent_ && colOptions.parent_.css('z-index', 0);
        var parent_ = self.$el.find('th > div');
        colOptions.parent_ = parent_;
        parent_.css('z-index', '100');
        self._openColOptions(e);
      });
    }

    return false;
  },

  showGeoreferenceWindow: function(e) {
    this.killEvent(e);
    this.trigger('georeference', null);
  },

  showColumnTypeOptions: function(e) {
    var self = this;
    var colOptions = HeaderView.colTypeOptions;
    var columnName = this.column[0];

    if (e) e.preventDefault();

    // If submenu was openened before, let's close it.
    if (colOptions.isOpen && columnName == colOptions.column) {
      colOptions.hide(); 
      return false;
    }

    // If submenu is from different column or it is closed.
    colOptions.hide(function() {
      self._openColTypeOptions(e);
    });

    return false;
  }

});

})();
