/** @jsx React.DOM */
var ModelMixin = require('react/model_mixin');
var React = require('react');
var getGeometryValue = require('table/table_view/row/get_geometry_value');

module.exports = React.createClass({
  mixins:[ModelMixin],

  getBackboneModels: function(){
    return [this.props.row]
  },

  _firstCellClassNames: function() {
    var classNames = 'cell';

    if (this.props.table.isReadOnly()) {
      classNames += ' disabled';
    } else {
      classNames += ' row_header';
    }

    return classNames;
  },

  _cellClassNames: function(value, columnName) {
    var classNames = 'cell ' + this._columnType(columnName);

    if (cdb.admin.Row.isReservedColumn(columnName)) {
      classNames += ' disabled';
    }

    if (value === null) {
      classNames += ' isNull';
    }

    return classNames;
  },

  _formattedCellValue: function(value, columnName) {
    if (this._columnType(columnName) === 'geometry') {
      return getGeometryValue(this.props.table, value);
    } else if (value === null) {
      return 'null';
    } else if (value === '') {
      return '';
    } else {
      return value;
    }
  },

  _columnType: function(columnName) {
    return this.props.table.getColumnType(columnName);
  },

  render: function() {
    var cells = this.props.row.attributes;

    return (
      <tr>
        <td className="rowHeader">
          <div className={this._firstCellClassNames()} />
        </td>
        {this.props.table.columnNames().map(function(columnName) {
          var value = cells[columnName];
          return (
            <td>
              <div className={this._cellClassNames(value, columnName)}>
                {this._formattedCellValue(value, columnName)}
              </div>
            </td>
          );
        }, this)}
      </tr>
    );
  }
});
