var _ = require('underscore');
var SQLUtils = require('../../helpers/sql-utils');

var sqlKeywords = 'alter and as asc between by count create delete desc distinct drop from group having in insert into is join like not on or order select set table union update values where limit';
var postgisKeywords = 'ST_GeometryType st_polygon st_multipolygon st_multilinestring st_linestring st_multipoint st_point';

var memo = {};

var REQUIRED_OPTS = [
  'querySchemaModel',
  'layerDefinitionModel'
];

module.exports = {
  init: function (opts) {
    if (!opts) throw new Error('options are required for sql hints');
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);
  },

  hints: function () {
    // array of objects {text, type}
    return this.hints;
  },

  reset: function () {
    this.hints = _.union(this._getTableName(), this._getColumns(), this._getKeywords(), this._getPostgisKeywords());
    return this;
  },

  _getKeywords: function () {
    return this._keywords || this._memo(sqlKeywords);
  },

  _getPostgisKeywords: function () {
    return this._gisKeywords || this._memo(postgisKeywords);
  },

  _getColumns: function () {
    var columns = this._querySchemaModel.columnsCollection;
    return columns.map(function (mdl) {
      var columnName = mdl.get('name');
      return {
        text: columnName,
        type: 'C'
      };
    });
  },

  _getTableName: function () {
    var tableName = this._layerDefinitionModel.getTableName();
    tableName = SQLUtils.getUnqualifiedName(tableName);
    return [{
      text: tableName,
      type: 'T'
    }];
  },

  _memo: function (str) {
    if (str in memo) {
      return memo[str];
    } else {
      return (memo[str] = this._make(str));
    }
  },

  _make: function (str) {
    return str.split(' ').map(function (item) {
      return {
        text: item
      };
    });
  }
};
