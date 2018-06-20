var _ = require('underscore');
var Backbone = require('backbone');
var CDB = require('internal-carto.js');

var queryTemplate = _.template('SELECT <%= column %> FROM (<%= sql %>) _table_sql GROUP BY <%= column %> ORDER BY <%= column %> ASC');
var MAX_ROW_COUNT = 100;

module.exports = Backbone.Model.extend({
  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel param is required');
    if (!opts.nodeDefModel) throw new Error('nodeDefModel param is required');

    this._query = opts.nodeDefModel.querySchemaModel.get('query');
    this._rowData = [];

    this._SQL = new CDB.SQL({
      user: opts.configModel.get('user_name'),
      sql_api_template: opts.configModel.get('sql_api_template'),
      api_key: opts.configModel.get('api_key')
    });

    this.on('change:column', this.fetch, this);
  },

  _onQueryDone: function (r) {
    var resultCount = _.size(r.rows);

    if (resultCount && resultCount < MAX_ROW_COUNT) {
      this._rowData = _.pluck(r.rows, this.get('column'));
      this.trigger('columnsFetched', this._rowData);
    }
  },

  fetch: function () {
    if (this.get('column') && this._query) {
      this._SQL.execute(
        queryTemplate({
          sql: this._query,
          column: this.get('column')
        }),
        null,
        {
          extra_params: ['page', 'rows_per_page'],
          page: 0,
          rows_per_page: 40,
          success: this._onQueryDone.bind(this),
          error: function () {
            // TODO: what happens if fails?
          }
        }
      );
    }
  },

  getRows: function () {
    var rowDataCount = _.size(this._rowData);
    if (rowDataCount > 0) {
      if (rowDataCount && rowDataCount < MAX_ROW_COUNT) {
        return _.reject(this._rowData, _.isNull);
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
});
