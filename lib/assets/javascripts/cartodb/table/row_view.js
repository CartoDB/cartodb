
/**
 * view used to render each row
 */
cdb.admin.RowView = cdb.ui.common.RowView.extend({
  classLabel: 'cdb.admin.RowView',
  events: {
    'click      .row_header': '_onOptionsClick',
    'mouseout   .row_header': '_onOptionsOut'
  },

  cellRenderers: {
    'default': '_renderDefault',
    'boolean': '_renderBoolean',
    'number': '_renderNumber',
    'geometry': '_renderGeometry'
  },

  initialize: function() {
    var self = this;
    this.elder('initialize');
    _.bindAll(this, '_onOptionsClick', '_onOptionsOut')
    this.options.row_header = true;

    this.retrigger('saving', this.model);
    this.retrigger('saved', this.model);
    this.retrigger('errorSaving', this.model);
  },

  _getRowOptions: function() {
    if(!cdb.admin.RowView.rowOptions) {
       var rowOptions = cdb.admin.RowView.rowOptions = new cdb.admin.RowHeaderDropdown({
        position: 'position',
        user: this.tableView.user,
        template_base: "table/views/table_row_header_options",
        tick: "top",
        horizontal_position: "left",
        tableData: this.getTableView().dataModel,
        table: this.getTableView().model
      });
      rowOptions.render();
      this.retrigger('createRow', rowOptions);

    }
    return cdb.admin.RowView.rowOptions;
  },

  _onOptionsOut: function(e) {
    var $relatedTarget = $(e.relatedTarget)
      , current_row_id = $relatedTarget.closest('tr').attr('id');

    if ($relatedTarget.closest('.dropdown').length == 0 && $relatedTarget.closest('.row_header').length == 0) {
      if (this.rowOptions) this.rowOptions.hide();
    }
  },

  _onOptionsClick: function(e) {
    var rowOptions, tableData, pos, tableOffset, left, top
      , $target = $(e.target);

    tableData = this.getTableView().dataModel;
    if(this.table.isReadOnly()) {
      // if data is read only do not allow
      // to add or remove rows
      return;
    }
    rowOptions = this._getRowOptions();
    e.preventDefault();
    $target.append(rowOptions.el);

    left = 30;
    top = 5;

    // If it is the last td of the table, show the dropdown upwards
    if ($target.closest("tr").is(':last-child') && $target.closest("tr").index() > 1) {
      rowOptions.options.vertical_position = "top";
      rowOptions.options.tick = "bottom";
    } else {
      rowOptions.options.vertical_position = "down";
      rowOptions.options.tick = "top";
    }

    rowOptions.setRow(this.model);
    rowOptions.openAt(left, top);
    this.rowOptions = rowOptions; // to make it testable;
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

    var obj = $(this[render](value));
    obj.addClass('cell');
    if(cdb.admin.Row.isReservedColumn(colName)) {
      obj.addClass('disabled');
    }

    // It is the first cell?
    if(colName === '' && value === '') {
      if(this.table.isReadOnly()) {
        // No row options button
        obj
          .addClass('disabled')
          .html('');
      } else {
        // Add row options button
        obj.addClass('row_header');
      }
    }
    return obj;
  },

  _renderDefault: function(value, additionalClasses) {
    additionalClasses = additionalClasses || '';

    var cell;

    if (value === null) {
      additionalClasses += " isNull"
      cell =  '<div class="'+ additionalClasses +'">null</div>';
    } else cell =  '<div class="'+ additionalClasses +'">' + _.escape(value) + '</div>';

    return cell;
  },

  _renderBoolean: function(value) {
    return this._renderDefault(value, 'boolean');
  },

  _renderNumber: function(value) {
    return this._renderDefault(value, 'number');
  },

  _renderGeometry: function(value) {
    var self = this;
    function geomDisplayValue(value) {
      var v = _.uniq(self.table.geomColumnTypes());
      if (!_.isNull(value) && v && v.length && v[0]) {
        v = v[0];
        // capitalize
        value = v.charAt(0).toUpperCase() + v.substring(1).toLowerCase();
      }
      return value;
    }

    var objValue = {};
    try {
      objValue = JSON.parse(value);
      function formatCoord(c) {
        var val = "       ";
        if (c !== undefined) {
          val = c.toFixed(4);
          if (c > 0) {
            val = " " + val;
          }
        }
        return val;
      }
      if(objValue.type === 'Point') {
        value = formatCoord(objValue.coordinates[0]) + ',' + formatCoord(objValue.coordinates[1]);
      } else {
        value = geomDisplayValue(value);
      }
    } catch (e) {
      value = geomDisplayValue(value);
    }
    return this._renderDefault(value);
  }

});

