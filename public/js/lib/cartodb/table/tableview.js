
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
      return v.render().el;
    }
    return '';
  }
});

