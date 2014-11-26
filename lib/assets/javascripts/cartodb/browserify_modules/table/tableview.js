/** @jsx React.DOM */
var ModelMixin = require('react/model_mixin');
var React = require('react');
var ColumnHeader = require('table/table_view/column_header');
var Row = require('table/table_view/row');

var columns = function(table) {
  if (table.get('schema')) {
    return table.get('schema');
  } else {
    return [];
  }
};

var rows = function(tableData) {
  if (tableData.length > 0 && tableData.fetched) {
    return tableData;
  } else {
    return [];
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
            {columns(this.props.table).map(function(column) {
              return (<ColumnHeader key={column[0]} column={column} table={this.props.table} />);
            }, this)}
          </tr>
        </thead>
        <tbody>
          {rows(this.props.tableData).map(function(row) {
            return (
              <Row key={row.get('id')}
                row={row}
                table={this.props.table} />
            );
          }, this)}
        </tbody>
        <tfoot>
        </tfoot>
      </table>
    );
  }
});
