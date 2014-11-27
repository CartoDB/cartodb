/** @jsx React.DOM */
var ModelMixin = require('react/model_mixin');
var React = require('react');
var getGeometryValue = require('table/table_view/row/get_geometry_value');
var openCellEditorDialog = require('table/table_view/row/open_cell_editor_dialog');
var cdb = require('cartodbui');

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

  _editCell: function(columnName, x, ev) {
    if (this._canEditCell(columnName)) {
      // Reuse existing Backbone view, retrofitted to work here:
      openCellEditorDialog({
        ev: ev,
        row: this.props.row,
        columnName: columnName,
        columnType: this._columnType(columnName),
        isTableReadOnly: this.props.table.isReadOnly()
      });
    }
  },

  _canEditCell: function(columnName) {
    var table = this.props.table;
    return !(table.isReservedColumn(columnName) && !table.isReadOnly() && this._columnType(columnName) !== 'geometry');
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
        {this.props.table.columnNames().map(function(columnName, x) {
          var value = cells[columnName];
          return (
            <td key={columnName}
                onDoubleClick={this._editCell.bind(this, columnName, x)}>
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
