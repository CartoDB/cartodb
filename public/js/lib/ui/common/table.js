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
var Row = Backbone.Model.extend({
});

cdb.ui.common.TableData = Backbone.Collection.extend({
    model: Row,

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
});

/**
 * render a table
 * this widget needs two data sources
 * - the table model which contains information about the table (columns and so on). See TableProperties
 * - the model with the data itself (TableData)
 */
cdb.ui.common.Table = cdb.core.View.extend({

  tagName: 'table',

  events: {
  },

  default_options: {
  },

  initialize: function() {
    _.defaults(this.options, this.default_options);
    this.dataModel = this.options.dataModel;
    this.dataModel.bind('change', this._changeCell, this);
  },

  _changeCell: function(row) {
    var id = 'cell_' + row.get('id') + '_' +
    this.$('#row_' + row.get('id')).html(this._renderRow(row));
  },

  _renderRow: function(row) {
    var tr = $('<tr>');
    tr.attr('id', 'row_' + row.get('id'));
    _(row.attributes).each(function(value, key) {
      var td = $('<td>');
      td.attr('id', 'cell_' + row.get('id') + '_' + key);
      td.append(value);
      tr.append(td);
    });
    return tr;
  },

  _renderHeader: function() {
    var thead = $("<thead>");
    var tr = $("<tr>");
    _(this.model.get('schema')).each(function(col) {
      tr.append($("<td>").html(col[0]));
    });
    thead.append(tr);
    return thead;
  },

  render: function() {
    var self = this;
    self.$el.html('');

    // render header
    self.$el.append(self._renderHeader());

    // render data
    this.dataModel.each(function(row) {
        var tr = self._renderRow(row);
        self.$el.append(tr);
    });
    return this;
  }
});
