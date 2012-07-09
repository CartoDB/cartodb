/**
 * generic table
 *
 * this class creates a HTML table based on Table model (see below) and modify it based on model changes
 *
 * usage example:
 *
      var table = new Table({
          model: table
      });

      $('body').append(table.render().el);

  * model should be a collection of Rows

 */

/**
 * represents a table row
 */
cdb.ui.common.Row = Backbone.Model.extend({
});

cdb.ui.common.TableData = Backbone.Collection.extend({
    model: cdb.ui.common.Row,

    /**
     * get value for row index and columnName
     */
    getCell: function(index, columnName) {
      var r = this.at(index);
      if(!r) {
        return null;
      }
      return r.get(columnName);
    }

});

/**
 * contains information about the table, mainly the schema
 */
cdb.ui.common.TableProperties = Backbone.Model.extend({
  columnNames: function() {
    return _.map(this.get('schema'), function(c) {
      return c[0];
    });
  }
});

/**
 * renders a table row
 */
cdb.ui.common.RowView = cdb.core.View.extend({
  tagName: 'tr',

  initialize: function() {
    this.model.bind('change', this.render, this);
    this.model.bind('destroy', this.clean, this);
    this.add_related_model(this.model);
    this.order = this.options.order;
  },

  valueView: function(colName, value) {
    return value;
  },

  render: function() {
    var self = this;
    var tr = this.$el;
    tr.html('');
    var row = this.model;
    tr.attr('id', 'row_' + row.id);

    var tdIndex = 0;
    if(this.options.row_header) {
        var td = $('<td>');
        td.append(self.valueView('', ''));
        td.attr('data-x', tdIndex);
        tdIndex++;
        tr.append(td);
    }

    var attrs = this.order || _.keys(row.attributes);
    _(attrs).each(function(key) {
      var value = row.attributes[key];
      if(value !== undefined) {
        var td = $('<td>');
        td.attr('id', 'cell_' + row.id + '_' + key);
        td.attr('data-x', tdIndex);
        tdIndex++;
        td.append(self.valueView(key, value));
        tr.append(td);
      }
    });
    return this;
  },

  getCell: function(x) {
    var childNo = x;
    if(this.options.row_header) {
      ++x;
    }
    return this.$('td:eq(' + x + ')');
  }

});

/**
 * render a table
 * this widget needs two data sources
 * - the table model which contains information about the table (columns and so on). See TableProperties
 * - the model with the data itself (TableData)
 */
cdb.ui.common.Table = cdb.core.View.extend({

  tagName: 'table',
  rowView: cdb.ui.common.RowView,

  events: {
      'click td': '_cellClick'
  },

  default_options: {
  },

  initialize: function() {
    _.defaults(this.options, this.default_options);
    this.dataModel = this.options.dataModel;
    this.rowViews = [];

    // binding
    this.dataModel.bind('reset', this._renderRows, this);
    this.dataModel.bind('add', this.addRow, this);
    this.model.bind('change', this.render, this);

    // assert the rows are removed when table is removed
    this.bind('clean', this.clear_rows, this);

    // prepare for cleaning
    this.add_related_model(this.dataModel);
    this.add_related_model(this.model);
  },

  headerView: function(column) {
      return column[0];
  },

  _renderHeader: function() {
    var self = this;
    var thead = $("<thead>");
    var tr = $("<tr>");
    if(this.options.row_header) {
      tr.append($("<th>").append(self.headerView(['', 'header'])));
    }
    _(this.model.get('schema')).each(function(col) {
      tr.append($("<th>").append(self.headerView(col)));
    });
    thead.append(tr);
    return thead;
  },

  /**
   * remove all rows
   */
  clear_rows: function() {
    _(this.rowViews).each(function(tr) {
      tr.clean();
    });
    this.rowViews = [];
  },

  /**
   * add rows
   */
  addRow: function(row) {
    var self = this;
    var tr = new self.rowView({
      model: row,
      order: this.model.columnNames()
    });
    self.$el.append(tr.render().el);
    tr.$el.attr('data-y', self.rowViews.length);
    self.rowViews.push(tr);
  },

  /**
   * render only data rows
   */
  _renderRows: function() {
    var self = this;
    this.clear_rows();
    this.dataModel.each(function(row) {
      self.addRow(row);
    });
  },

  /**
   * render table
   */
  render: function() {
    var self = this;

    self.$el.html('');

    // render header
    self.$el.append(self._renderHeader());

    // render data
    self._renderRows();

    return this;

  },

  /**
   * return jquery cell element of cell x,y
   */
  getCell: function(x, y) {
    if(this.options.row_header) {
      ++y;
    }
    return this.rowViews[y].getCell(x);
  },

  _cellClick: function(e) {
    e.preventDefault();
    var cell = $(e.target);
    var x = parseInt(cell.attr('data-x'), 10);
    var y = parseInt(cell.parent().attr('data-y'), 10);
    this.trigger('cellClick', cell, x, y);
  }


});
