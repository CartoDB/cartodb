
/**
 * view used to render each row
 */
cdb.admin.RowView = cdb.ui.common.RowView.extend({

  events: {
    'click .row_header': 'click_header'
  },

  cellRenderers: {
    'default': '_renderDefault',
    'boolean': '_renderBoolean',
    'number': '_renderNumber'
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
    var rowOptions, tableData, pos, tableOffset, left, top;

    $target = $(e.target);

    tableData = this.getTableView().dataModel;
    if(tableData.isReadOnly()) {
      // if data is read only do not allow
      // to add or remove rows
      return;
    }
    rowOptions = this._getRowOptions();
    e.preventDefault();
    $target.append(rowOptions.el);
    pos = $target.position();

    // xabel: Yep, browser specific code. I'm so sorry for thiw. What's this? 2007?
    if(/Chrome/.test(navigator.appVersion)) {
      left = pos.left + 30;
      top = pos.top + 0;
    } else {
      pos = $target.offset();
      tableOffset = $target.parents('table').offset();
      left = pos.left - tableOffset.left + 20;
      top = pos.top - tableOffset.top - 15;
    }
    rowOptions.setRow(this.model);
    rowOptions.openAt(left, top);
    return false;
  },

  /**
   * return each cell view
   */
  valueView: function(colName, value) {
    this.table = this.table || this.getTableView().model;
    var render = '_renderDefault';
    if(colName.length) {
      var colType = this.table.getColumnType(colName);
      render = this.cellRenderers[colType] || render;
    }
    var obj = this[render](value);
    obj.addClass('cell');
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
  },

  _renderDefault: function(value) {
    return $('<div>').append(value);
  },

  _renderBoolean: function(value) {
    var v = '';
    if(value === '' || value === null) {
    } else if(value) {
      v = 'true';
    } else {
      v = 'false';
    }
    return $('<div>').append(v);
  },

  _renderNumber: function(value) {
    var d = this._renderDefault(value);
    return d.addClass('number');
  }

});

