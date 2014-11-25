/** @jsx React.DOM */
var ModelMixin = require('react/model_mixin');
var React = require('react');
var ColumnHeader = require('table/table_view/column_header');

var renderColumnsFromTable = function(table) {
  // Due to how the table is currently rendered we need to account for that the table is either non-existing, or incomplete.
  if (!(table && table.get('schema'))) {
    return;
  }

  return table.get('schema').map(function(column) {
    return (<ColumnHeader key={column[0]} column={column} table={table} />);
  });
};


module.exports = React.createClass({
  mixins:[ModelMixin],

  getBackboneModels: function(){
    return [
      this.props.table
    ]
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
        </tbody>
        <tfoot>
        </tfoot>
      </table>
    );
  }
});
