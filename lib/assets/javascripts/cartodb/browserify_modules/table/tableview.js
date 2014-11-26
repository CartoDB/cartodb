/** @jsx React.DOM */
var ModelMixin = require('react/model_mixin');
var React = require('react');
var ColumnHeader = require('table/table_view/column_header');
var Row = require('table/table_view/row');

var renderColumnsFromTable = function(table) {
  // Due to how the table is currently rendered we need to account for that the table is either non-existing, or incomplete.
  if (!(table && table.get('schema'))) {
    return;
  }

  return table.get('schema').map(function(column) {
    return (<ColumnHeader key={column[0]} column={column} table={table} />);
  });
};

var renderRows = function(table, tableData) {
  if (tableData.length > 0 && tableData.fetched) {
    return tableData.map(function(row) {
      return (
        <Row key={row.get('id')}
          row={row}
          table={table} />
      );
    });
  }
};


module.exports = React.createClass({
  mixins:[ModelMixin],

  getBackboneModels: function() {
    var models = [
      this.props.table,
      this.props.user,
      this.props.tableData
    ];

    if (this.props.layer) {
      models.push(this.props.layer);
    }

    return models;
  },

  render: function() {
    return (
      <table>
        <thead>
          <tr>
            <th><div><div></div></div></th>
            {renderColumnsFromTable(this.props.table)}
          </tr>
        </thead>
        <tbody>
          {renderRows(this.props.table, this.props.tableData)}
        </tbody>
        <tfoot>
        </tfoot>
      </table>
    );
  }
});
