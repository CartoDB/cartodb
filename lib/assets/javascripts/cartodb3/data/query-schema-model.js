var _ = require('underscore');
var Backbone = require('backbone');
var syncAbort = require('./backbone/sync-abort');
var createGeometry = require('../value-objects/geometry');
var QueryRowsCollection = require('./query-rows-collection');

var MAX_GET_LENGTH = 1024;
var WRAP_SQL_TEMPLATE = 'select * from (<%= sql %>) __wrapped';
var PARAMS = {
  sort_order: 'asc',
  rows_per_page: 40,
  page: 0
};

/**
 * Model to represent a schema of a SQL query.
 */
module.exports = Backbone.Model.extend({

  defaults: {
    query: '',
    status: 'unavailable', //, unfetched, fetching, fetched
    ready: false // if ready there _may_ be data available on the given query (but there's no guarantee)
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
    return this.get('status') === 'fetched';
  },

  canFetch: function () {
    return this.get('query') && !this.isFetched();
  },

  fetch: function (opts) {
    if (!this.canFetch()) return;

    this.set('status', 'fetching');

    opts = opts || {};
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
      this.set({
        query_errors: error,
        status: 'unavailable'
      });
    }.bind(this);

    return Backbone.Model.prototype.fetch.call(this, opts);
  },

  parse: function (r) {
    var attrs = {status: 'fetched'};

    this.rowsSampleCollection.reset(r.rows);

    var columns = _.map(r.fields, function (d, name) {
      return {
        name: name,
        type: d.type
      };
    }, this);
    this.columnsCollection.reset(columns);

    return attrs;
  },

  /**
   * @override {Backbone.prototype.isNew} for this.destroy() to work (not try to send DELETE request)
   */
  isNew: function () {
    return true;
  },

  /**
   * @return {Geom} value object or null if not available
   */
  getGeometry: function () {
    var row = this.rowsSampleCollection.find(this._getRawGeomFromRow);
    return row
      ? createGeometry(this._getRawGeomFromRow(row))
      : null;
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

  _getRawGeomFromRow: function (m) {
    return m.get('the_geom') || m.get('the_geom_webmercator');
  },

  _getSqlApiQueryParam: function () {
    return _.template(WRAP_SQL_TEMPLATE)({
      sql: this.get('query')
    });
  },

  _httpMethod: function () {
    return this.get('query').length > MAX_GET_LENGTH
      ? 'POST'
      : 'GET';
  }

});
