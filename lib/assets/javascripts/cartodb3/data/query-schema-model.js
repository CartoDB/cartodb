var _ = require('underscore');
var Backbone = require('backbone');
var syncAbort = require('./backbone/sync-abort');
var createGeometry = require('../value-objects/geometry');
var QueryRowsCollection = require('./query-rows-collection');

var MAX_GET_LENGTH = 1024;
var WRAP_SQL_TEMPLATE = 'select * from (<%= sql %>) __wrapped where the_geom is not null';
var PARAMS = {
  sort_order: 'asc',
  rows_per_page: 40,
  page: 0
};

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
    status: STATUS.unavailable, // , unfetched, fetching, fetched
    ready: false, // until true there's no data available on the table(s) used in the query,
    simple_geom: undefined // may be known before ready (e.g. persisted from a previos app life-cycle)
  },

  /**
   * @override {Backbone.prototype.sync} abort ongoing request if there is any
   */
  sync: syncAbort,

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;
    this.columnsCollection = new Backbone.Collection([]);
    this.rowsSampleCollection = new QueryRowsCollection([]);

    this.on('change', this._onChange, this);
  },

  url: function () {
    return this._configModel.getSqlApiUrl();
  },

  isFetched: function () {
    return this.get('status') === STATUS.fetched;
  },

  canFetch: function () {
    return this.get('query') && !this.isFetched();
  },

  fetch: function (opts) {
    if (!this.canFetch()) return;

    this.set('status', STATUS.fetching);

    opts = opts || {};
    var errorCallback = opts && opts.error;

    opts.data = _.extend(
      opts.data || {},
      {
        api_key: this._configModel.get('api_key'),
        q: this._getSqlApiQueryParam()
      },
      PARAMS
    );

    opts.method = this._httpMethod();

    opts.error = function (model, response) {
      var error = response.responseText ? JSON.parse(response.responseText).error : [];
      errorCallback && errorCallback(error);
      this.set({
        query_errors: error,
        status: STATUS.unavailable
      });
    }.bind(this);

    return Backbone.Model.prototype.fetch.call(this, opts);
  },

  parse: function (r) {
    this.rowsSampleCollection.reset(r.rows);

    var columns = _.map(r.fields, function (d, name) {
      return {
        name: name,
        type: d.type
      };
    });
    this.columnsCollection.reset(columns);

    var rawGeom = this._findRawGeom();
    var geometry = rawGeom && createGeometry(rawGeom);

    return {
      status: STATUS.fetched,
      simple_geom: geometry && geometry.getSimpleType()
    };
  },

  hasGeometryData: function () {
    return this.get('status') === STATUS.fetched && this.get('simple_geom') != null;
  },

  /**
   * @override {Backbone.prototype.isNew} for this.destroy() to work (not try to send DELETE request)
   */
  isNew: function () {
    return true;
  },

  _onChange: function () {
    if (!this.hasChanged('status') && this.get('status') === 'fetching') {
      // If is already fetching just redo the fetch with latest attrs
      this.fetch();
      return;
    }

    var hasChangedQuery = this.hasChanged('query');
    if (hasChangedQuery) {
      this.columnsCollection.reset();
    }
    if (hasChangedQuery || this.hasChanged('ready')) {
      this.rowsSampleCollection.reset();
      this.set('status', this.get('query') ? 'unfetched' : 'unavailable');
    }
  },

  resetDueToAlteredData: function () {
    this.set('status', 'unfetched');
    this.trigger('resetDueToAlteredData');
    this.fetch();
  },

  _getSqlApiQueryParam: function () {
    return _.template(WRAP_SQL_TEMPLATE)({
      sql: this.get('query')
    });
  },

  _findRawGeom: function () {
    var rawGeom;

    this.rowsSampleCollection
      .some(function (row) {
        rawGeom = row.get('the_geom') || row.get('the_geom_webmercator');
        return !!rawGeom;
      });

    return rawGeom;
  },

  _httpMethod: function () {
    return this.get('query').length > MAX_GET_LENGTH
      ? 'POST'
      : 'GET';
  }

});
