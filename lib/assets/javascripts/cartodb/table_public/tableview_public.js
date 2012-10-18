(function() {
  /**
   * public table view
   */
  cdb.open.PublicTableView = cdb.admin.TableView.extend({
    initialize: function() {
      this.elder('initialize')
    },
    headerView: function(column) {
      var self = this;
      if(column[1] !== 'header') {
        var v = new cdb.open.PublicHeaderView({
          column: column,
          table: this.model,
          sqlView: this.options.sqlView,
        });

        this.addView(v);
        return v.render().el;
      } else {
        return '<div><div></div></div>';
      }
    },

    _onSQLView: function() {
    },

    rowView: cdb.open.PublicRowView,
  })

  cdb.open.PublicTableTab = cdb.admin.TableTab.extend({
    tabClass: cdb.open.PublicTableView
  })
})()
