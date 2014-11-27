/** @jsx React.DOM */
var ModelMixin = require('react/model_mixin');
var React = require('react');
var ColumnHeader = require('table/table_view/column_header/react_component');
var Row = require('table/table_view/row/react_component');


module.exports = React.createClass({
  mixins:[ModelMixin],

  getBackboneModels: function() {
    var models = [
      this.props.table,
      this.props.user,
      this.props.tableData,
      this.props.vis
    ];
    if (this.props.layer) {
      models.push(this.props.layer);
    }
    return models;
  },

  getInitialState: function() {
    // Setup non-standard way of updating the DOM on scroll (see below)
    this._lastX = 0;
    return null;
  },

  componentDidMount: function() {
    this._updateColumnsFixedPosition();
    $(window).scroll(this._scrollHandler);
  },

  componentDidUpdate: function() {
    this._updateColumnsFixedPosition();
  },

  componentWillUnmount: function() {
    $(window).off('scroll', this._scrollHandler);
  },

  _scrollHandler: function() {
    var w = $(window);
    var newX = w.scrollLeft();

    // Only update on horizontal scroll
    if (newX !== this._lastX) {
      this._lastX = newX;
      this._updateColumnsFixedPosition();
    }
  },

  _updateColumnsFixedPosition: function() {
    // Let's modify the DOM node directly rather than using setState or similar
    // This is a rather unique special case, due to window.scroll being triggered for every scroll change, for which
    // we want to minimize re-renders, and do it here to avoid duplicating scroll listeners.
    $(this.getDOMNode())
      .find('thead > tr > th > div > div') // The 2nd div which needs the marginLeft positioning.
      .css({ marginLeft: '-' + this._lastX + 'px' });
  },

  _columns: function() {
    var table = this.props.table;
    if (table.get('schema')) {
      return table.get('schema');
    } else {
      return [];
    }
  },

  _rows: function() {
    var tableData = this.props.tableData;
    if (tableData.length > 0 && tableData.fetched) {
      return tableData;
    } else {
      return [];
    }
  },

  _tableClassNames: function() {
    if (this.props.table.isSync()) {
      return 'synced';
    } else if (this.props.vis.isVisualization()) {
      return 'vis';
    }
  },

  render: function() {
    return (
      <table className={this._tableClassNames()}>
        <thead>
          <tr>
            <th><div><div></div></div></th>
            {this._columns().map(function(column) {
              return (<ColumnHeader key={column[0]} column={column} table={this.props.table} />);
            }, this)}
          </tr>
        </thead>
        <tbody>
          {this._rows().map(function(row) {
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
