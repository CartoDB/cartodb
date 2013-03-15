
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
    this.retrigger('savingError', this.model);
  },

  _getRowOptions: function() {
    if(!cdb.admin.RowView.rowOptions) {
       var rowOptions = cdb.admin.RowView.rowOptions = new cdb.admin.RowHeaderDropdown({
        position: 'position',
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
    if(tableData.isReadOnly()) {
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
    if(colName == 'the_geom' || colName == 'the_geom_webmercator' ) {
      if (value) {
        var geom_types = this.table.geomColumnTypes();

        if (geom_types.length > 0) {
          value = geom_types;
        } else {
          // Oh! no geo types saved previously
          // Let's get row geom type and save it in the table geometry types array
          var geom_type = this.model.getGeomType();
          this.table.addGeomColumnType(geom_type, true);
          value = this.table.geomColumnTypes();
        }
      }
    }

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
      var tableData = this.getTableView().dataModel;
      if(tableData.isReadOnly()) {
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
    var objValue = {};
    try {
      objValue = JSON.parse(value);
      if(objValue.type === 'Point') {

        value = objValue.coordinates[0] + ', ' + objValue.coordinates[1];
      }
    } catch (e) {

    }
    return this._renderDefault(value)
  }

});

