/** @jsx React.DOM */
var ModelMixin = require('react/model_mixin');
var React = require('react');
var getGeometryValue = require('table/table_view/get_geometry_value');

var firstCellClassNames = function(table) {
  if (table.isReadOnly()) {
    return 'disabled';
  } else {
    return 'row_header';
  }
};

var renderCells = function(table, row) {
  var cells = row.attributes;
  return table.columnNames().map(function(columnName) {
    var value = cells[columnName];
    var columnType = table.getColumnType(columnName);
    var classNames = 'cell ' + columnType;

    if (cdb.admin.Row.isReservedColumn(columnName)) {
      classNames += ' disabled';
    }

    if (columnType === 'geometry') {
      value = getGeometryValue(table, value);
    }

    if (value === null) {
      classNames += ' isNull';
    }

    return (
      <td>
        <div className={classNames}>
          {value || 'null'}
        </div>
      </td>
    );
  });
};

module.exports = React.createClass({
  mixins:[ModelMixin],

  getBackboneModels: function(){
    return [this.props.row]
  },

  render: function() {
    return (
      <tr>
        <td className="rowHeader">
          <div className={'cell'+ firstCellClassNames(this.props.table)} />
        </td>
        {renderCells(this.props.table, this.props.row)}
      </tr>
    );
  }
});
