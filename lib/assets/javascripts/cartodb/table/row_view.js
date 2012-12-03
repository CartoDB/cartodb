
/**
 * view used to render each row
 */
cdb.admin.RowView = cdb.ui.common.RowView.extend({
  classLabel: 'cdb.admin.RowView',
  events: {
    'click .row_header': 'click_header',
    // 'mouseout .row_header': 'mouseout_event'
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
    _.bindAll(this, 'mouseout_header', 'click_header',
      'mousein_event', 'mouseout_event')
    this.options.row_header = true;

    this.retrigger('saving', this.model);
    this.retrigger('saved', this.model);
    this.retrigger('savingError', this.model);

    this.$el.bind('mouseover', this.mousein_event);
    this.$el.bind('mouseout', this.mouseout_event);

  },
  /**
   * When the mouse steps over the row, mark the attribute 'hasMouse'
   */
  mousein_event: function() {
    this.hasMouse = true;
  },
  /**
   * Here be dragons: this is a hack to be able to detect when
   * the mouse has left a row for real. Mouseout event is not enough,
   * because it gets triggered when you change between tds.
   * It listen for this changes and mark the row as 'unmoused',
   * waiting for another event to step in and mark this row as
   * 'moused' again.
   *
   * @param  {Event} ev
   */
  mouseout_event: function(ev) {
    this.hasMouse = false;
    setTimeout(this.checkDropdownOpen.bind(this),25);
  },
  /**
   * Check if the cursor is not over this row and if the option menu is
   * opened, and if so, clear the menu
   */
  checkDropdownOpen: function() {
    if(!this.hasMouse && this.rowOptions) {
      this.rowOptions.hide();
    }
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
      this.retrigger('createRow', rowOptions);

    }
    return cdb.admin.RowView.rowOptions;
  },
  mouseout_header: function(e) {
    if(this.rowOptions) {
      // this.rowOptions.hide();
    }
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
    if($.browser.mozilla) {
      pos = $target.offset();
      tableOffset = $target.parents('table').offset() || 0;
      left = pos.left - tableOffset.left + 20;
      top = pos.top - tableOffset.top - 15;
    } else {
      left = pos.left + 30;
      top = pos.top + 0;
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
    if((colName == 'the_geom' || colName == 'the_geom_webmercator' ) &&
      this.getTableView().dataModel.isReadOnly() ) {
      value = 'GeoJSON'
    }
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
    var additionalClasses = '';
    if(value === null) {
      additionalClasses = "isNull"
    }
    var cell =  $('<div class="'+ additionalClasses +'">').append(_.escape(value));

    return cell;
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

