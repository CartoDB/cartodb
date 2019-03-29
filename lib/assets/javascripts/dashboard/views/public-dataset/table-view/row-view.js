const _ = require('underscore');
const $ = require('jquery');
const RowView = require('dashboard/components/table/row-view');
const RowModel = require('dashboard/data/table/row-model');

/**
 * view used to render each row
 */
module.exports = RowView.extend({
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

  initialize: function (opts) {
    RowView.prototype.initialize.call(this, opts);
    _.bindAll(this, '_onOptionsClick', '_onOptionsOut');
    this.options.row_header = true;

    this.retrigger('saving', this.model);
    this.retrigger('saved', this.model);
    this.retrigger('errorSaving', this.model);
  },

  _getRowOptions: function () {
    throw new Error('Method not migrated, check original implementation');
  },

  _onOptionsOut: function (e) {
    var $relatedTarget = $(e.relatedTarget);

    if ($relatedTarget.closest('.dropdown').length == 0 && $relatedTarget.closest('.row_header').length == 0) { // eslint-disable-line eqeqeq
      if (this.rowOptions) this.rowOptions.hide();
    }
  },

  _onOptionsClick: function (e) {
    var rowOptions;
    var left;
    var top;
    var $target = $(e.target);

    if (this.table.isReadOnly()) {
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
    if ($target.closest('tr').is(':last-child') && $target.closest('tr').index() > 1) {
      rowOptions.options.vertical_position = 'top';
      rowOptions.options.tick = 'bottom';
    } else {
      rowOptions.options.vertical_position = 'down';
      rowOptions.options.tick = 'top';
    }

    rowOptions.setRow(this.model);
    rowOptions.openAt(left, top);
    this.rowOptions = rowOptions; // to make it testable;
    return false;
  },

  /**
   * return each cell view
   */
  valueView: function (colName, value) {
    this.table = this.table || this.getTableView().model;
    var render = '_renderDefault';
    if (colName.length) {
      var colType = this.table.getColumnType(colName);
      render = this.cellRenderers[colType] || render;
    }

    var obj = $(this[render](value));
    obj.addClass('cell');
    if (RowModel.isReservedColumn(colName)) {
      obj.addClass('disabled');
    }

    // It is the first cell?
    if (colName === '' && value === '') {
      if (this.table.isReadOnly()) {
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

  _renderDefault: function (value, additionalClasses) {
    additionalClasses = additionalClasses || '';

    var cell;

    if (value === null) {
      additionalClasses += ' isNull';
      cell = '<div class="' + additionalClasses + '">null</div>';
    } else cell = '<div class="' + additionalClasses + '">' + _.escape(value) + '</div>';

    return cell;
  },

  _renderBoolean: function (value) {
    return this._renderDefault(value, 'boolean');
  },

  _renderNumber: function (value) {
    return this._renderDefault(value, 'number');
  },

  _renderGeometry: function (value) {
    // Overriden in public-row-view
  }

});
