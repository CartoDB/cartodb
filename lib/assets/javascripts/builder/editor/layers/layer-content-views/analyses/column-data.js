var _ = require('underscore');
var Backbone = require('backbone');
var CDB = require('internal-carto.js');
var queryTemplate = _.template('SELECT min(<%= column %>) as min, max(<%= column %>) as max FROM (<%= sql %>) _table_sql');
var queryBooleanTemplate = _.template('SELECT DISTINCT <%= column %> as val FROM (<%= sql %>) _table_sql');

module.exports = Backbone.Model.extend({
  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel param is required');
    if (!opts.nodeDefModel) throw new Error('nodeDefModel param is required');

    this._nodeDefModel = opts.nodeDefModel;

    this._SQL = new CDB.SQL({
      user: opts.configModel.get('user_name'),
      sql_api_template: opts.configModel.get('sql_api_template'),
      api_key: opts.configModel.get('api_key')
    });

    this._query = opts.nodeDefModel.querySchemaModel.get('query');

    this.on('change:column', this.fetch, this);
  },

  _onQueryDone: function (r) {
    if (_.size(r.rows) > 0) {
      this.trigger('columnsFetched', _.first(r.rows));
    }
  },

  fetch: function () {
    var template = this.get('type') === 'boolean' ? queryBooleanTemplate : queryTemplate;

    if (this.get('column') && this._query) {
      this._SQL.execute(
        template({
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
  }
});
