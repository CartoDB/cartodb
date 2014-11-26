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

  getInitialState: function() {
    // Setup non-standard way of updating the DOM on scroll (see below)
    this._lastX = 0;
    return null;
  },

  componentDidMount: function() {
    this.updateColumnsFixedPosition();
    $(window).scroll(this.scrollHandler);
  },

  scrollHandler: function() {
    var w = $(window);
    var newX = w.scrollLeft();

    // Only update on horizontal scroll
    if (newX !== this._lastX) {
      this._lastX = newX;
      this.updateColumnsFixedPosition();
    }
  },

  componentDidUpdate: function() {
    this.updateColumnsFixedPosition();
  },

  updateColumnsFixedPosition: function() {
    // Let's modify the DOM node directly rather than using setState or similar
    // This is a rather unique special case, due to window.scroll being triggered for every scroll change, for which
    // we want to minimize re-renders, and do it here to avoid duplicating scroll listeners.
    $(this.getDOMNode())
      .find('thead > tr > th > div > div') // The 2nd div which needs the marginLeft positioning.
      .css({ marginLeft: '-' + this._lastX + 'px' });
  },

  componentWillUnmount: function() {
    $(window).off('scroll', this.scrollHandler);
  },

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
