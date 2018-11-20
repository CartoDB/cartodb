var _ = require('underscore');
var Backbone = require('backbone');
var BaseModel = require('./query-base-model');
var QueryRowsCollection = require('./query-rows-collection');
var SQLUtils = require('builder/helpers/sql-utils');
var STATUS = require('./query-base-status');

var DEFAULT_TABLE_QUERY_TEMPLATE = _.template('SELECT * FROM <%= tableName %>');
var WRAPPED_SQL_QUERY_TEMPLATE = _.template('SELECT * FROM (<%= sql %>) __wrapped');

/**
 * Model to represent a schema of a SQL query.
 */
module.exports = BaseModel.extend({

  defaults: {
    query: '',
    sort_order: 'asc',
    rows_per_page: 0,
    page: 0,
    status: STATUS.initial,
    ready: false // until true there's no data available on the table(s) used in the query
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    BaseModel.prototype.initialize.call(this, attrs, opts);

    this._configModel = opts.configModel;
    this.columnsCollection = new Backbone.Collection([]);
    this.rowsCollection = new QueryRowsCollection([]);

    if (this.get('status') === STATUS.initial) {
      this._setStatusPerQueryValue();
    }

    this._addChangeListener();
  },

  url: function () {
    return this._configModel.getSqlApiUrl();
  },

  fetch: function (opts) {
    if (!this.canFetch()) return;

    this.set('status', STATUS.fetching);

    opts = opts || {};
    opts.errorCallback = opts && (opts.originalError || opts.error);
    var successCallback = opts && (opts.success || opts.complete);

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

    opts.success = function (model, response) {
      this._resetRepeatedError();
      successCallback && successCallback(response);
    }.bind(this);

    opts.error = function (model, response) {
      if (response && response.statusText !== 'abort') {
        var error = response.responseText ? JSON.parse(response.responseText).error : [];

        this._incrementRepeatedError();

        this.set({
          query_errors: error,
          status: this.hasRepeatedErrors() ? STATUS.errored : STATUS.unavailable
        });

        opts.errorCallback && opts.errorCallback({
          status: response.status || 'Unknown',
          error: error
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

  getColumnType: function (columnName) {
    return this.isFetched() ? this.columnsCollection.findWhere({ name: columnName }).get('type') : undefined;
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
    this.set('status', this.get('query') ? STATUS.unfetched : STATUS.unavailable, { silent: true });
  },

  setError: function (error) {
    var queryErrors = this.get('query_errors');
    if (queryErrors && queryErrors.length) {
      return;
    }

    this._incrementRepeatedError();

    this.set({
      query_errors: error,
      status: this.hasRepeatedErrors() ? STATUS.errored : STATUS.unavailable
    });
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
  }
});
