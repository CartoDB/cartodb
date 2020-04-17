var Backbone = require('backbone');
var QueryRowModel = require('./query-row-model');
var syncAbort = require('./backbone/sync-abort');
var _ = require('underscore');
var STATUS = require('./query-base-status');

var MAX_GET_LENGTH = 1024;
var WRAP_SQL_TEMPLATE = 'select <%= selectedColumns %> from (<%= sql %>) __wrapped';
var MAX_REPEATED_ERRORS = 3;

module.exports = Backbone.Collection.extend({
  defaults: {
    empty: true
  },

  DEFAULT_FETCH_OPTIONS: {
    rows_per_page: 40,
    sort_order: 'asc',
    page: 0
  },

  // Due to a problem how Backbone checks if there is a duplicated model
  // or not, we can't create the model with a function + its necessary options
  model: QueryRowModel,

  sync: syncAbort,

  url: function () {
    return this._configModel.getSqlApiUrl();
  },

  initialize: function (models, opts) {
    opts = opts || {};

    this._repeatedErrors = 0;
    this._tableName = opts.tableName;
    this._querySchemaModel = opts.querySchemaModel;
    this._configModel = opts.configModel;

    this.statusModel = new Backbone.Model({
      status: STATUS.initial
    });

    this._initBinds();
  },

  _initBinds: function () {
    this.listenTo(this._querySchemaModel, 'change:query', this._onQuerySchemaQueryChange);

    if (this._querySchemaModel && this._querySchemaModel.columnsCollection) {
      this.listenTo(this._querySchemaModel.columnsCollection, 'reset', this._onColumnsCollectionReset);
    }

    this.listenTo(this.statusModel, 'change:status', this._onStatusChanged);
  },

  _onColumnsCollectionReset: function () {
    this._onQuerySchemaQueryChange();

    if (this.shouldFetch()) {
      this.fetch();
    }
  },

  getStatusValue: function () {
    return this.statusModel.get('status');
  },

  isInInitialStatus: function () {
    return this.getStatusValue() === STATUS.initial;
  },

  isFetched: function () {
    return this.getStatusValue() === STATUS.fetched;
  },

  isErrored: function () {
    return this.getStatusValue() === STATUS.errored;
  },

  isFetching: function () {
    return this.getStatusValue() === STATUS.fetching;
  },

  isDone: function () {
    return this.isFetched() || this.isErrored();
  },

  isInFinalStatus: function () {
    var finalStatuses = [STATUS.unavailable, STATUS.fetched, STATUS.errored];
    return _.contains(finalStatuses, this.getStatusValue());
  },

  isUnavailable: function () {
    return this.getStatusValue() === STATUS.unavailable;
  },

  canFetch: function () {
    var hasQuery = !!this._querySchemaModel.get('query');
    var isReady = this._querySchemaModel.get('ready');
    var isFetched = this._querySchemaModel.isFetched();
    var isErrored = this._querySchemaModel.isErrored();

    return hasQuery && isReady && isFetched && !isErrored;
  },

  shouldFetch: function () {
    return !this.isFetched() && !this.isFetching() && this.canFetch() && !this.isErrored();
  },

  resetFetch: function () {
    this.statusModel.set('status', STATUS.unfetched);
  },

  isEmpty: function () {
    throw new Error('QueryRowsCollection.isEmpty() is an async operation. Use `.isEmptyAsync` instead.');
  },

  isEmptyAsync: function () {
    if (this.isInFinalStatus()) {
      return Promise.resolve(this.size() === 0);
    } else {
      return new Promise(function (resolve) {
        this.listenToOnce(this, 'inFinalStatus', function () {
          resolve(this.size() === 0);
        });
      }.bind(this));
    }
  },

  _onStatusChanged: function () {
    if (this.isInFinalStatus()) {
      this.trigger('inFinalStatus');
    }
  },

  _onQuerySchemaQueryChange: function () {
    this.statusModel.set('status', 'unfetched');
    this.reset([], { silent: true });
  },

  _geometryColumnSQL: function (column) {
    /* eslint-disable */
    return [
      "CASE",
      "WHEN GeometryType(" + column + ") = 'POINT' THEN",
        "ST_AsGeoJSON(" + column + ",8)",
      "WHEN (" + column + " IS NULL) THEN",
        "NULL",
      "ELSE",
        "GeometryType(" + column + ")",
      "END " + column
    ].join(' ');
    /* eslint-enable */
  },

  // return wrapped SQL removing the_geom and the_geom_webmercator
  // to avoid fetching those columns.
  // So for a sql like
  // select * from table the returned value is
  // select column1, column2, column3... from table
  _getWrappedSQL: function (excludeColumns) {
    var self = this;
    var schema = this._querySchemaModel.columnsCollection.toJSON();

    var selectedColumns = _
      .chain(schema)
      .omit(function (item) {
        return _.contains(excludeColumns, item.name);
      })
      .map(function (item, index) {
        if (item.type === 'geometry') {
          return self._geometryColumnSQL(item.name);
        }
        return '"' + item.name + '"';
      })
      .value()
      .join(',');

    return _.template(WRAP_SQL_TEMPLATE)({
      selectedColumns: selectedColumns,
      sql: this._querySchemaModel.get('query')
    });
  },

  _httpMethod: function (query) {
    return query.length > MAX_GET_LENGTH ? 'POST' : 'GET';
  },

  _incrementRepeatedError: function () {
    this._repeatedErrors++;
  },

  _resetRepeatedError: function () {
    this._repeatedErrors = 0;
  },

  hasRepeatedErrors: function () {
    return this._repeatedErrors >= MAX_REPEATED_ERRORS;
  },

  fetch: function (opts) {
    if (this.isFetching()) return;

    opts = opts || {};

    var previousStatus = this.getStatusValue();
    this.statusModel.set('status', STATUS.fetching);

    var excludeColumns = (opts.data && opts.data.exclude) || [];
    var query = this._getWrappedSQL(excludeColumns);

    opts = opts || {};
    opts.data = _.extend(
      {},
      this.DEFAULT_FETCH_OPTIONS,
      opts.data && _.omit(opts.data, 'exclude') || {},
      {
        api_key: this._configModel.get('api_key'),
        q: query
      }
    );

    opts.method = this._httpMethod(query);
    var errorCallback = opts.error;
    opts.error = function (coll, resp) {
      if (previousStatus === STATUS.unavailable) {
        this._incrementRepeatedError();
      }

      if (resp && resp.error) {
        this._querySchemaModel.setError(resp.error);
      }

      this.trigger('fail', coll, resp);
      this.statusModel.set('status', this.hasRepeatedErrors() ? STATUS.errored : STATUS.unavailable);
      errorCallback && errorCallback(coll, resp);
    }.bind(this);

    var successCallback = opts.success;
    opts.success = function (coll, resp, options) {
      if (resp && resp.error) {
        return opts.error.apply(this, arguments);
      }

      this._resetRepeatedError();
      this.statusModel.set('status', STATUS.fetched);
      successCallback && successCallback(coll, resp);
    }.bind(this);

    // Needed to reset the whole collection when a fetch is done
    opts.reset = true;

    return Backbone.Collection.prototype.fetch.call(this, opts);
  },

  parse: function (r) {
    return this._parseWithID(r.rows);
  },

  reset: function (result, opts) {
    var items = [];

    if (result && result.rows) {
      // If reset comes from a fetch, we need to parse the rows
      items = result.rows;
    } else {
      // If it comes directly from a simple reset function
      items = result;
    }

    Backbone.Collection.prototype.reset.apply(this, [this._parseWithID(items)]);
  },

  _parseWithID: function (array) {
    return _.map(array, function (attrs) {
      attrs.__id = _.uniqueId();
      return attrs;
    });
  },

  addRow: function (opts) {
    opts = opts || {};
    this.create(
      {
        __id: _.uniqueId()
      },
      _.extend(
        opts,
        {
          wait: true,
          parse: true
        }
      )
    );
  },

  setTableName: function (name) {
    if (!name) return;

    if (this._tableName) {
      this._tableName = name;

      this.each(function (rowModel) {
        rowModel._tableName = name;
      });
    }
  }
});
