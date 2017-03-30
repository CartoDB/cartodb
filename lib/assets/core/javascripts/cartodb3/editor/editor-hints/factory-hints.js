var _ = require('underscore');
var TableNameUtils = require('../../helpers/table-name-utils');

var memo = {};

var REQUIRED_OPTS = [
  'querySchemaModel',
  'layerDefinitionModel'
];

var OPTIONAL_TOKENS = [
  'tokens'
];

var defaults = {
  tableName: true,
  columnsName: true,
  keywords: true
};

module.exports = {
  init: function (opts) {
    if (!opts) throw new Error('options are required for hints');

    this.options = _.defaults(
      _.pick(opts, ['tableName', 'columnsName', 'keywords'])
      , defaults
    );

    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    _.each(OPTIONAL_TOKENS, function (item) {
      this['_' + item] = opts[item];
    }, this);
  },

  hints: function () {
    // array of objects {text, type}
    return this.hints;
  },

  reset: function () {
    this.hints = _.union(this._getTableName(), this._getColumns(), this._getKeywords());
    return this;
  },

  _getKeywords: function () {
    if (this.options.keywords) {
      return this._tokens && this._memo(this._tokens);
    } else {
      return [];
    }
  },

  _getColumns: function () {
    if (!this.options.columnsName) {
      return [];
    }

    var columns = this._querySchemaModel.columnsCollection;
    return columns.map(function (mdl) {
      var columnName = mdl.get('name');
      return {
        text: columnName,
        type: 'Column_name'
      };
    });
  },

  _getTableName: function () {
    if (!this.options.tableName) {
      return [];
    }

    var tableName = this._layerDefinitionModel.getTableName();
    tableName = TableNameUtils.getUnqualifiedName(tableName);
    return [{
      text: tableName,
      type: 'Table_name'
    }];
  },

  _memo: function (str, type) {
    if (str in memo) {
      return memo[str];
    } else {
      return (memo[str] = this._make(str, type));
    }
  },

  _make: function (str, type) {
    return _.chain(str).map(function (set) {
      return set.keywords.split(' ').map(function (item) {
        return {
          text: item,
          type: set.type
        };
      });
    }).flatten().value();
  }
};
