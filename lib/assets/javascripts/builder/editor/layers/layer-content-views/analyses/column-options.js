var _ = require('underscore');
var CDB = require('internal-carto.js');
var Backbone = require('backbone');
var tableQueryTemplate = _.template('SELECT * FROM <%= tableName %>');

module.exports = Backbone.Model.extend({
  defaults: {
    columnsFetched: false
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');

    this._columnOptions = [];

    this._SQL = new CDB.SQL({
      user: opts.configModel.get('user_name'),
      sql_api_template: opts.configModel.get('sql_api_template'),
      api_key: opts.configModel.get('api_key')
    });

    if (opts.nodeDefModel) {
      this.setNode(opts.nodeDefModel);
    }
  },

  _fetch: function () {
    if (this._query) {
      this.set('columnsFetched', false);
      this._SQL.execute(
        this._query,
        null,
        {
          extra_params: ['page', 'rows_per_page'],
          page: 0,
          rows_per_page: 0,
          success: this._onQueryDone.bind(this),
          error: function () {
            // TODO: what happens if fails?
          }
        }
      );
    }
  },

  setDataset: function (tableName) {
    this._columnOptions = [];
    this._query = tableQueryTemplate({ tableName: tableName });
    this._fetch();
  },

  setNode: function (nodeDefModel) {
    this._columnOptions = [];
    this._query = nodeDefModel.querySchemaModel.get('query');
    this._fetch();
  },

  findColumn: function (columnName, columnType) {
    return _.find(this.filterByType(columnType), function (column) {
      return column.val === columnName;
    }, this);
  },

  all: function () {
    return this.filterByType();
  },

  filterByType: function (columnType) {
    if (!_.size(this._columnOptions)) {
      return [];
    }

    var columns = _.map(this._columnOptions, function (value, key) {
      var columnName = key;
      return {
        val: columnName,
        label: columnName,
        type: value.type
      };
    });

    if (_.isArray(columnType)) {
      columns = columns.filter(function (column) {
        return _.contains(columnType, column.type);
      });
    } else if (columnType) {
      columns = columns.filter(function (column) {
        return column.type === columnType;
      });
    }
    return columns;
  },

  _onQueryDone: function (r) {
    this._columnOptions = r.fields;
    this.set('columnsFetched', true);
    this.trigger('columnsFetched');
  }
});
