
/**
 * view used to render each row
 */
cdb.admin.RowView = cdb.ui.common.RowView.extend({
  /**
   * return each cell view
   */
  valueView: function(colName, value) {
    return $('<div>').append(value);
  }
});

/**
 * table view shown in admin
 */
cdb.admin.TableView = cdb.ui.common.Table.extend({

  rowView: cdb.admin.RowView,

  headerView: function(column) {
    var l = $('<label>')
      .addClass('strong')
      .addClass('small')
      .html(column[0]);
    return $('<div>').append(l);
  }
});

