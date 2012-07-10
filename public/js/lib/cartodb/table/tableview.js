
/**
 * view used to render each row
 */
cdb.admin.RowView = cdb.ui.common.RowView.extend({

  initialize: function() {
     this.constructor.__super__.initialize.apply(this);
     this.options.row_header = true;
  },
  /**
   * return each cell view
   */
  valueView: function(colName, value) {
    return $('<div>').append(value);
  }
});


/**
 * header cell view, manages operations on table columns
 */

cdb.admin.HeaderView = cdb.core.View.extend({

  events: {
    'click .coloptions': 'showColumnOptions'
  },

  initialize: function() {
    this.column = this.options.column;
    this.template = this.getTemplate('table/views/table_header_view');
  },

  render: function() {
    this.$el.append(this.template({
      col_name: this.column[0],
      col_type: this.column[1]
    }));
    return this;
  },

  showColumnOptions: function(e) {
    e.preventDefault();
    var colOptions= new cdb.admin.Dropdown({
      target: 'a.small',
      template_base: "table/views/table_header_options"
    })
    colOptions.render();
    colOptions.bind('optionClicked', function(e) {
      e.preventDefault();
      console.log(arguments);
      return false;
    });
    this.$el.append(colOptions.el);
    colOptions.open();
    return false;
  }

});

/**
 * table view shown in admin
 */
cdb.admin.TableView = cdb.ui.common.Table.extend({

  rowView: cdb.admin.RowView,

  initialize: function() {
     this.constructor.__super__.initialize.apply(this);
     this.options.row_header = true;
  },

  headerView: function(column) {
    if(column[1] !== 'header') {
      var v = new cdb.admin.HeaderView({ column: column });
      this.addView(v);
      return v.render().el;
    }
    return '';
  }
});

cdb.admin.TableTab = cdb.core.View.extend({

  className: 'table',

  initialize: function() {
    this.tableView = new cdb.admin.TableView({
      dataModel: this.model.data(),
      model: this.model
    });
  },

  render: function() {
    this.$el.append(this.tableView.el);
    return this;
  }

});

