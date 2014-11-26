/** @jsx React.DOM */
var ModelMixin = require('react/model_mixin');
var React = require('react');

var renderChangeColumnTypeBtn = function(isReserved, type) {
  if (isReserved) {
    return (<a className="disabled">{type}</a>);
  } else {
    return (<a className="coltype own" href="#change_column">{type}</a>);
  }
};

var renderLabel = function(isReserved, isGeocoded, name, type) {
  var classNames = 'strong small';
  if (type === 'the_geom' || type === 'the_geom_webmercator') {
    classNames += ' interactuable';
  }
  var extra;
  if (isGeocoded) {
    extra = <span className="tiny geo">GEO</span>
  }

  return (
    <label className={classNames}>
      <a className="coloptions" href={'#'+name}>
        {name}
        {extra}
      </a>
    </label>
  );
};

module.exports = React.createClass({
  mixins:[ModelMixin],

  getBackboneModels: function(){
    return [
      this.props.table
    ]
  },

  render: function() {
    var columnType = this.props.column[1];
    var columnName = this.props.column[0];
    var isReserved = (this.props.table.isReadOnly() || this.props.table.isReservedColumn(columnName));
    var isGeocoded = columnType === 'geometry' && !this.props.table.isReadOnly();
    var nameExtra;
    if (isGeocoded) {
      nameExtra = 'GEO';
    }

    return (
      <th>
        <div>
          <div> {/* see tableview component for why this el's style is set through there rather than here */}
            {renderLabel(isReserved, isGeocoded, columnName)}
            <p className="small">{renderChangeColumnTypeBtn(isReserved, columnType)}
            </p>
          </div>
          <p className="auto">{columnName}_{nameExtra}</p>
          <a className="auto">{columnType}_</a>
        </div>
      </th>
    );
  }
});
