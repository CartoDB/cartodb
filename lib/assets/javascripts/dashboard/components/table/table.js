const $ = require('jquery');
const _ = require('underscore');
const CoreView = require('backbone/core-view');
const RowView = require('dashboard/components/table/row-view');

/**
 * render a table
 * this widget needs two data sources
 * - the table model which contains information about the table (columns and so on). See TableProperties
 * - the model with the data itself (TableData)
 */
module.exports = CoreView.extend({

  tagName: 'table',
  rowView: RowView,

  events: {
    'click td': '_cellClick',
    'dblclick td': '_cellDblClick'
  },

  default_options: {
  },

  initialize: function () {
    var self = this;
    _.defaults(this.options, this.default_options);
    this.dataModel = this.options.dataModel;
    this.rowViews = [];

    // binding
    this.setDataSource(this.dataModel);
    this.model.bind('change', this.render, this);
    this.model.bind('change:dataSource', this.setDataSource, this);

    // assert the rows are removed when table is removed
    this.bind('clean', this.clear_rows, this);

    // prepare for cleaning
    this.add_related_model(this.dataModel);
    this.add_related_model(this.model);

    // we need to use custom signals to make the tableview aware of a row being deleted,
    // because when you delete a point from the map view, sometimes it isn't on the dataModel
    // collection, so its destroy doesn't bubble throught there.
    // Also, the only non-custom way to acknowledge that a row has been correctly deleted from a server is with
    // a sync, that doesn't bubble through the table
    this.model.bind('removing:row', function () {
      self.rowsBeingDeleted = self.rowsBeingDeleted ? self.rowsBeingDeleted + 1 : 1;
      self.rowDestroying();
    });
    this.model.bind('remove:row', function () {
      if (self.rowsBeingDeleted > 0) {
        self.rowsBeingDeleted--;
        self.rowDestroyed();
        if (self.dataModel.length == 0) { // eslint-disable-line eqeqeq
          self.emptyTable();
        }
      }
    });
  },

  headerView: function (column) {
    return column[0];
  },

  setDataSource: function (dm) {
    if (this.dataModel) {
      this.dataModel.unbind(null, null, this);
    }
    this.dataModel = dm;
    this.dataModel.bind('reset', this._renderRows, this);
    this.dataModel.bind('error', this._renderRows, this);
    this.dataModel.bind('add', this.addRow, this);
  },

  _renderHeader: function () {
    var self = this;
    var thead = $('<thead>');
    var tr = $('<tr>');
    if (this.options.row_header) {
      tr.append($('<th>').append(self.headerView(['', 'header'])));
    } else {
      tr.append($('<th>').append(self.headerView(['', 'header'])));
    }
    _(this.model.get('schema')).each(function (col) {
      tr.append($('<th>').append(self.headerView(col)));
    });
    thead.append(tr);
    return thead;
  },

  /**
   * remove all rows
   */
  clear_rows: function () {
    this.$('tfoot').remove();
    this.$('tr.noRows').remove();

    // unbind rows before cleaning them when all are gonna be removed
    var rowView = null;
    while ((rowView = this.rowViews.pop())) {
      // this is a hack to avoid all the elements are removed one by one
      rowView.unbind(null, null, this);
      // each element removes itself from rowViews
      rowView.clean();
    }
    // clean all the html at the same time
    this.rowViews = [];
  },

  /**
   * add rows
   */
  addRow: function (row, collection, options) {
    var self = this;
    var tr = new self.rowView({ // eslint-disable-line new-cap
      model: row,
      order: this.model.columnNames(),
      row_header: this.options.row_header
    });
    tr.tableView = this;

    tr.bind('clean', function () {
      var idx = _.indexOf(self.rowViews, tr);
      self.rowViews.splice(idx, 1);
      // update index
      for (var i = idx; i < self.rowViews.length; ++i) {
        self.rowViews[i].$el.attr('data-y', i);
      }
    }, this);
    tr.bind('changeRow', this.rowChanged, this);
    tr.bind('saved', this.rowSynched, this);
    tr.bind('errorSaving', this.rowFailed, this);
    tr.bind('saving', this.rowSaving, this);
    this.retrigger('saving', tr);

    tr.render();
    if (options && options.index !== undefined && options.index != self.rowViews.length) { // eslint-disable-line eqeqeq
      tr.$el.insertBefore(self.rowViews[options.index].$el);
      self.rowViews.splice(options.index, 0, tr);
      // tr.$el.attr('data-y', options.index);
      // change others view data-y attribute
      for (var i = options.index; i < self.rowViews.length; ++i) {
        self.rowViews[i].$el.attr('data-y', i);
      }
    } else {
      // at the end
      tr.$el.attr('data-y', self.rowViews.length);
      self.$el.append(tr.el);
      self.rowViews.push(tr);
    }

    this.trigger('createRow');
  },

  /**
  * Callback executed when a row change
  * @method rowChanged
  * @abstract
  */
  rowChanged: function () {},

  /**
  * Callback executed when a row is sync
  * @method rowSynched
  * @abstract
  */
  rowSynched: function () {},

  /**
  * Callback executed when a row fails to reach the server
  * @method rowFailed
  * @abstract
  */
  rowFailed: function () {},

  /**
  * Callback executed when a row send a POST to the server
  * @abstract
  */
  rowSaving: function () {},

  /**
  * Callback executed when a row is being destroyed
  * @method rowDestroyed
  * @abstract
  */
  rowDestroying: function () {},

  /**
  * Callback executed when a row gets destroyed
  * @method rowDestroyed
  * @abstract
  */
  rowDestroyed: function () {},

  /**
  * Callback executed when a row gets destroyed and the table data is empty
  * @method emptyTable
  * @abstract
  */
  emptyTable: function () {},

  /**
  * Checks if the table is empty
  * @method isEmptyTable
  * @returns boolean
  */
  isEmptyTable: function () {
    return (this.dataModel.length === 0 && this.dataModel.fetched);
  },

  /**
   * render only data rows
   */
  _renderRows: function () {
    this.clear_rows();
    if (!this.isEmptyTable()) {
      if (this.dataModel.fetched) {
        var self = this;

        this.dataModel.each(function (row) {
          self.addRow(row);
        });
      } else {
        this._renderLoading();
      }
    } else {
      this._renderEmpty();
    }
  },

  _renderLoading: function () {
  },

  _renderEmpty: function () {
  },

  /**
  * Method for the children to redefine with the table behaviour when it has no rows.
  * @method addEmptyTableInfo
  * @abstract
  */
  addEmptyTableInfo: function () {
    // #to be overwrite by descendant classes
  },

  /**
   * render table
   */
  render: function () {
    var self = this;

    // render header
    self.$el.html(self._renderHeader());

    // render data
    self._renderRows();

    return this;
  },

  /**
   * return jquery cell element of cell x,y
   */
  getCell: function (x, y) {
    if (this.options.row_header) {
      ++y;
    }
    return this.rowViews[y].getCell(x);
  },

  _cellClick: function (e, evtName) {
    evtName = evtName || 'cellClick';
    e.preventDefault();
    var cell = $(e.currentTarget || e.target);
    var x = parseInt(cell.attr('data-x'), 10);
    var y = parseInt(cell.parent().attr('data-y'), 10);
    this.trigger(evtName, e, cell, x, y);
  },

  _cellDblClick: function (e) {
    this._cellClick(e, 'cellDblClick');
  }

});
