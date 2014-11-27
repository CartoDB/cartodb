/** @jsx React.DOM */
var ModelMixin = require('react/model_mixin');
var React = require('react');

module.exports = React.createClass({
  mixins:[ModelMixin],

  getBackboneModels: function(){
    return []
  },

  getInitialState: function() {
    return {
      isEditingName: false
    }
  },
  
  componentDidUpdate: function() {
    if (this.state.isEditingName) {
      var el = $(this.getDOMNode()).find('input');
      this._focusAtEnd(el);
    }
  },

  _focusAtEnd: function(el) {
    var tmp = el.focus().val();
    el.val('').val(tmp);
  },

  _editName: function(ev) {
    ev.preventDefault();
    this.setState({
      isEditingName: true,
      newName: this._name()
    });
  },

  _abortEditName: function(ev) {
    this.setState({
      isEditingName: false
    })
  },

  _updateNewName: function(ev) {
    this.setState({
      newName: ev.target.value
    });
  },

  _rename: function(ev) {
    ev.preventDefault();
    this.props.table.renameColumn(this._name(), this.state.newName);
  },

  _type: function() {
    return this.props.column[1];
  },

  _name: function() {
    return this.props.column[0];
  },

  _isGeocoded: function(){
    return this._type() === 'geometry' && !this.props.table.isReadOnly();
  },

  _extra: function() {
    if (this._isGeocoded()) {
      return <span className="tiny geo">GEO</span>
    }
  },

  render: function() {
    var name = this._name();

    if (this.state.isEditingName) {
      return (
        <form onSubmit={this._rename}>
          <input type="text" className="col_name_edit"
            value={this.state.newName}
            onBlur={this._abortEditName}
            onChange={this._updateNewName}
          />
        </form>
      );
    } else {
      return (
        <a className="coloptions" href="javascript:void(0)"
          onDoubleClick={this._editName}
        >{name} {this._extra()}</a>
      );
    }
  }
});
