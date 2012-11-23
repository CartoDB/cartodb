
/**
 * dropdown when user clicks on a column name
 */
cdb.open.PublicHeaderDropdown =  cdb.admin.HeaderDropdown.extend({
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
});

