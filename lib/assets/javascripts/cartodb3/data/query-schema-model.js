var _ = require('underscore');
var cdb = require('cartodb.js');
var Backbone = require('backbone');
var syncAbort = require('./backbone/sync-abort');
var geometry = require('../value-objects/geometry');

var MAX_GET_LENGTH = 1024;
var WRAP_SQL_TEMPLATE = 'select * from (<%= sql %>) __wrapped limit <%= rows_sample_size %>';

/**
 * Model to represent a schema of a SQL query.
 */
module.exports = cdb.core.Model.extend({

  defaults: {
    query: '',
    status: 'unavailable', //, unfetched, fetching, fetched
    may_have_rows: false // this flag indicate if there _may_ be data available on the given query (but there's no guarantee)
  },

  /**
   * @override {Backbone.prototype.sync} abort ongoing request if there is any
   */
  sync: syncAbort,

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;

    this.columnsCollection = new Backbone.Collection([]);
    this.rowsSampleCollection = new Backbone.Collection([]);

    this.on('change', this._onChange, this);
  },

  url: function () {
    return this._configModel.getSqlApiUrl();
  },

  canFetch: function () {
    return this.get('query') && !this._isFetched();
  },

  fetch: function (opts) {
    if (!this.canFetch()) return;

    this.set('status', 'fetching');

    opts = opts || {};
    opts.data = {
      api_key: this._configModel.get('api_key'),
      q: this._getSqlApiQueryParam()
    };
    opts.method = this._httpMethod();
    opts.error = function () {
      this.set('status', 'unavailable');
    }.bind(this);

    return cdb.core.Model.prototype.fetch.call(this, opts);
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

  _onChange: function () {
    if (!this.hasChanged('status') && this.get('status') === 'fetching') {
      // If is already fetching just redo the fetch with latest attrs
      this.fetch();
      return;
    }

    var hasChangedQuery = this.hasChanged('query');
    if (hasChangedQuery || this.hasChanged('may_have_rows')) {
      if (hasChangedQuery) {
        this.columnsCollection.reset();
      }
      this.rowsSampleCollection.reset();
      this.set('status', this.get('query') ? 'unfetched' : 'unavailable');
    }
  },

  /**
   * @return {Geom} value object or null if not available
   */
  getGeometry: function () {
    var row = this.rowsSampleCollection.find(this._getRawGeomFromRow);
    return row
      ? geometry(this._getRawGeomFromRow(row))
      : null;
  },

  _getRawGeomFromRow: function (m) {
    return m.get('the_geom') || m.get('the_geom_webmercator');
  },

  _getSqlApiQueryParam: function () {
    return _.template(WRAP_SQL_TEMPLATE)({
      sql: this.get('query'),
      rows_sample_size: 10
    });
  },

  _httpMethod: function () {
    return this.get('query').length > MAX_GET_LENGTH
      ? 'POST'
      : 'GET';
  },

  _isFetched: function () {
    return this.get('status') === 'fetched';
  }

});
