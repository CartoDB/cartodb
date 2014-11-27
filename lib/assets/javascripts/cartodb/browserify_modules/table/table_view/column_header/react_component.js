/** @jsx React.DOM */
var ModelMixin = require('react/model_mixin');
var React = require('react');
var Title = require('table/table_view/column_header/title/react_component');
var Type = require('table/table_view/column_header/type/react_component');

module.exports = React.createClass({
  mixins:[ModelMixin],

  getBackboneModels: function() {
    return []
  },

  _labelClassNames: function() {
    var classNames = 'strong small';

    // Allowed to edit column?
    if (this._isAllowedToEditColumn()) {
      classNames += ' interactuable';
    }

    return classNames;
  },

  _isAllowedToEditColumn: function() {
    var name = this._name();
    return name !== 'the_geom' && name !== 'the_geom_webmercator';
  },

  _nameExtra: function() {
    if (this._isGeocoded()) {
      return 'GEO';
    }
  },

  _isGeocoded: function() {
    return this._type() === 'geometry' && !this.props.table.isReadOnly();
  },

  _type: function() {
    return this.props.column[1];
  },

  _name: function() {
    return this.props.column[0];
  },

  render: function() {
    var type = this._type();

    return (
      <th>
        <div>
          <div> {/* see tableview component for why this el's style is set through there rather than here */}
            <label className={this._labelClassNames()}>
              <Title table={this.props.table} column={this.props.column} />
            </label>
            <Type table={this.props.table} column={this.props.column} />
          </div>
          <p className="auto">{this._name()}_{this._nameExtra(type)}</p>
          <p className="auto">{type}_</p>
        </div>
      </th>
    );
  }
});
