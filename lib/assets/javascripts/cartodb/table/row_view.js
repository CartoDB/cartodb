
/**
 * view used to render each row
 */
cdb.admin.RowView = cdb.ui.common.RowView.extend({

  events: {
    'click .row_header': 'click_header'
  },

  initialize: function() {
     this.constructor.__super__.initialize.apply(this);
     this.options.row_header = true;
  },

  _getRowOptions: function() {
    if(!cdb.admin.RowView.rowOptions) {
       var rowOptions = cdb.admin.RowView.rowOptions= new cdb.admin.RowHeaderDropdown({
        position: 'position',
        template_base: "table/views/table_row_header_options",
        tick: "top",
        horizontal_position: "left",
        tableData: this.getTableView().dataModel
      });
      rowOptions.render();
    }
    return cdb.admin.RowView.rowOptions;
  },

  click_header: function(e) {
    var tableData = this.getTableView().dataModel;
    if(tableData.isReadOnly()) {
      // if data is read only do not allow
      // to add or remove rows
      return;
    }
    var rowOptions = this._getRowOptions();
    e.preventDefault();
    $(e.target).append(rowOptions.el);
    var pos = $(e.target).position();
    rowOptions.setRow(this.model);
    rowOptions.openAt(pos.left + 20, pos.top + 5);
    return false;
  },

  /**
   * return each cell view
   */
  valueView: function(colName, value) {
    var obj = $('<div>').append(value).addClass('cell');
    if(cdb.admin.Row.isReservedColumn(colName)) {
      obj.addClass('disabled');
    }
    if(colName === '' && value === '') {
      obj.addClass('row_header');
      //some space
      //TODO: do it with css
      obj.append('&nbsp;&nbsp;&nbsp;&nbsp;');
    }
    return obj;
  }
});

