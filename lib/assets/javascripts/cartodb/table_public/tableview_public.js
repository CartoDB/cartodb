(function() {
  /**
   * public table view
   */
  cdb.open.PublicTableView = cdb.admin.TableView.extend({
    initialize: function() {
      var self = this;
      this.elder('initialize');
      this.options.row_header = false;
      this.model.bind('dataLoaded', function() {
        self._checkEmptyTable();
        self._forceScroll();
      });
      _.bindAll(this, 'render', '_checkEmptyTable', 'addEmptyTableInfo');
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

    render: function() {
      this.elder('render');
      this._checkEmptyTable();
    },

    _checkEmptyTable: function() {
      if(this.isEmptyTable()) {
        this.addEmptyTableInfo();
      } else {
        this.$('footer').remove();
      }
    },


    addEmptyTableInfo: function() {
      this.template_base = cdb.templates.getTemplate('table_public/views/empty_table_public');
      var content = this.template_base(this.import_);

      var $footer = $('<tfoot><tr><td colspan="100">' + content + '</td></tr></tfoot>');
      this.$('footer').remove();
      this.$el.append($footer);
    },

    rowView: cdb.open.PublicRowView,
  })

  cdb.open.PublicTableTab = cdb.admin.TableTab.extend({
    tabClass: cdb.open.PublicTableView
  })
})()
