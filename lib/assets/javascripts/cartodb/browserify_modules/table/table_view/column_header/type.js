/** @jsx React.DOM */
var ModelMixin = require('react/model_mixin');
var React = require('react');

module.exports = React.createClass({
  mixins:[ModelMixin],

  getBackboneModels: function(){
    return []
  },

  _classNames: function() {
    if (this._isReserved()) {
      return 'disabled';
    } else {
      return 'coltype own';
    }
  },

  _isReserved: function() {
    return this.props.table.isReadOnly() || this.props.table.isReservedColumn(this._name());
  },

  _type: function() {
    return this.props.column[1];
  },

  _name: function() {
    return this.props.column[0];
  },

  render: function() {
    return (
      <p className="small">
        <a className={this._classNames()} href="javascript:void(0);">{this._type()}</a>
      </p>
    );
  }
});
