
/**
 * dropdown when user clicks on a column name
 */
cdb.open.PublicHeaderDropdown =  cdb.admin.HeaderDropdown.extend({
  isPublic: true,

  orderColumnsAsc: function(e) {
    e.preventDefault();
    var sql = "SELECT * FROM ("+ this.table.currentSQL +") AS subq ORDER BY " + this.column + ' ASC';

    this.table.sqlView.setSQL(sql);
    this.table.sqlView.fetch();

    this.hide();
    return false;
  },

  orderColumnsDesc: function(e) {
    e.preventDefault();
    var sql = "SELECT * FROM ("+ this.table.currentSQL +") AS subq ORDER BY " + this.column + ' DESC';

    this.table.sqlView.setSQL(sql);
    this.table.sqlView.fetch();
    this.hide();
    return false;
  },

  filterColumn: function(e) {
    e.preventDefault();
    var self = this;
    var dlg = new cdb.admin.FilterColumnDialog({
      table: this.table,
      column: this.column,
      ok: function(filter) {
        self.table.sqlView.filterColumn(self.column, self.table.get('name'), filter)
        self.table.sqlView.fetch();
      }
    });
    $('body').append(dlg.render().el);
    dlg.open();
    this.hide();
  }
});

