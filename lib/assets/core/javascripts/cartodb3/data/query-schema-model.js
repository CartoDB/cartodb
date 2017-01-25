var _ = require('underscore');
var Backbone = require('backbone');
var syncAbort = require('./backbone/sync-abort');
var QueryRowsCollection = require('./query-rows-collection');
var SQLUtils = require('../helpers/sql-utils');

var DEFAULT_TABLE_QUERY_TEMPLATE = _.template('SELECT * FROM <%= tableName %>');
var WRAPPED_SQL_QUERY_TEMPLATE = _.template('SELECT * FROM (<%= sql %>) __wrapped');

var MAX_GET_LENGTH = 1024;
var STATUS = {
  unavailable: 'unavailable',
  unfetched: 'unfetched',
  fetching: 'fetching',
  fetched: 'fetched'
};

/**
 * Model to represent a schema of a SQL query.
 */
module.exports = Backbone.Model.extend({

  defaults: {
    query: '',
    sort_order: 'asc',
    rows_per_page: 0,
    page: 0,
    status: STATUS.unavailable, // unfetched, fetching, fetched
    ready: false // until true there's no data available on the table(s) used in the query
  },

  sync: syncAbort, // override {Backbone.prototype.sync} abort ongoing request if there is any

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;
    this.columnsCollection = new Backbone.Collection([]);
    this.rowsCollection = new QueryRowsCollection([]);

    if (this.get('status') === STATUS.unavailable) {
      this._setStatusPerQueryValue();
    }

    this._addChangeListener();
  },

  url: function () {
    return this._configModel.getSqlApiUrl();
  },

  _addChangeListener: function () {
    this.bind('change', this._onChange, this);
  },

  _removeChangeListener: function () {
    this.unbind('change', this._onChange, this);
  },

  isFetched: function () {
    return this.get('status') === STATUS.fetched;
  },

  isFetching: function () {
    return this.get('status') === STATUS.fetching;
  },

  canFetch: function () {
    return this.hasQuery() && !this.isFetched() && this.get('ready');
  },

  hasQuery: function () {
    return !!this.get('query');
  },

  shouldFetch: function () {
    return this.canFetch() && !this.isFetched() && !this.isFetching();
  },

  fetch: function (opts) {
    if (!this.canFetch()) return;

    this.set('status', STATUS.fetching);

    opts = opts || {};
    var errorCallback = opts && opts.error;

    opts.data = _.extend(
      opts.data || {},
      {
        sort_order: this.get('sort_order'),
        rows_per_page: this.get('rows_per_page'),
        page: this.get('page'),
        api_key: this._configModel.get('api_key'),
        q: this._getSqlApiQueryParam()
      }
    );

    opts.method = this._httpMethod();

    opts.error = function (model, response) {
      if (response && response.statusText !== 'abort') {
        var error = response.responseText ? JSON.parse(response.responseText).error : [];
        errorCallback && errorCallback(error);
        this.set({
          query_errors: error,
          status: STATUS.unavailable
        });
      }
    }.bind(this);

    return Backbone.Model.prototype.fetch.call(this, opts);
  },

  parse: function (r) {
    this.rowsCollection.reset(r.rows);

    this.columnsCollection.reset(
      _.map(r.fields, function (d, name) {
        return {
          name: name,
          type: d.type
        };
      })
    );

    return { status: STATUS.fetched };
  },

  /**
   * @override {Backbone.prototype.isNew} for this.destroy() to work (not try to send DELETE request)
   */
  isNew: function () {
    return true;
  },

  hasDefaultQueryFor: function (tableName) {
    if (!this.hasQuery()) {
      return false;
    }
    var defaultQueryForTableName = DEFAULT_TABLE_QUERY_TEMPLATE({ tableName: tableName });
    return SQLUtils.isSameQuery(this.get('query'), defaultQueryForTableName);
  },

  getColumnNames: function () {
    return this.columnsCollection.pluck('name');
  },

  _onChange: function () {
    this._removeChangeListener();

    if (!this.hasChanged('status') && this.get('status') === STATUS.fetching) {
      this.fetch(); // If is already fetching just redo the fetch with latest attrs
    } else {
      if (this.hasChanged('query')) {
        this.columnsCollection.reset();
        this._setStatusPerQueryValue();
      }
    }

    this._addChangeListener();
  },

  _setStatusPerQueryValue: function () {
    this.set('status', this.get('query') ? STATUS.unfetched : STATUS.unavailable);
  },

  // Basically checks if an schema is different than the current one
  hasDifferentSchemaThan: function (schemaArray) {
    return !_.every(schemaArray, function (columnObj) {
      var columnModel = this.columnsCollection.findWhere({ name: columnObj.name });
      return columnModel && (columnModel.get('type') === columnObj.type || columnObj.type == null);
    }, this);
  },

  resetDueToAlteredData: function () {
    this.set('status', STATUS.unfetched);
    this.trigger('resetDueToAlteredData');
    this.fetch();
  },

  _getSqlApiQueryParam: function () {
    return WRAPPED_SQL_QUERY_TEMPLATE({
      sql: this.get('query')
    });
  },

  _httpMethod: function () {
    return this._getSqlApiQueryParam().length > MAX_GET_LENGTH
      ? 'POST'
      : 'GET';
  }

});
