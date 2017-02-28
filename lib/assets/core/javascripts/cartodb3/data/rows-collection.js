var CDB = require('cartodb.js');
var Backbone = require('backbone');
var checkAndBuildOpts = require('../helpers/required-opts');

var queryTemplate = _.template('SELECT <%= column %> FROM (<%= sql %>) _table_sql');
var MAX_ROW_COUNT = 1;

var STATUS = {
  unavailable: 'unavailable',
  unfetched: 'unfetched',
  fetching: 'fetching',
  fetched: 'fetched'
};

var REQUIRED_OPTS = [
  'query'
];

module.exports = Backbone.Collection.extend({

  defaults: {
    query: '',
    sort_order: 'asc',
    rows_per_page: 0,
    page: 0,
    status: STATUS.unavailable, // unfetched, fetching, fetched
    ready: false // until true there's no data available on the table(s) used in the query
  },

  initialize: function (models, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  isFetched: function () {
    return this.get('status') === STATUS.fetched;
  },

  isFetching: function () {
    return this.get('status') === STATUS.fetching;
  },

  canFetch: function () {
    return this.hasQuery() && this.get('ready');
  },

  hasQuery: function () {
    return !!this.get('query');
  },

  shouldFetch: function () {
    return this.canFetch() && !this.isFetched() && !this.isFetching();
  },

  fetch: function () {
    if (this._query) {
      this._SQL.execute(
        queryTemplate({
          sql: this._query
        }),
        null, {
          extra_params: ['page', 'rows_per_page'],
          page: 0,
          rows_per_page: MAX_ROW_COUNT,
          success: this._onQueryDone.bind(this),
          error: function () {
            // TODO
          }
        }
      );
    }
  },

  _onQueryDone: function (r) {
    this._rowData = r.rows;
  },

  isEmpty: function () {
    return _.isEmpty(this._rowData);
  }
});
