/** @jsx React.DOM */
var ModelMixin = require('react/model_mixin');
var React = require('react');

module.exports = React.createClass({
  mixins:[ModelMixin],

  getBackboneModels: function(){
    return [this.props.visualisation]
  },

  render: function() {
    return (
      <table className="table page_down">
        <thead>
          <tr>
            <th>id</th>
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
