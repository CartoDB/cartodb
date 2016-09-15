var _ = require('underscore');
var Backbone = require('backbone');
var syncAbort = require('./backbone/sync-abort');
/* eslint-disable */
var template = _.template("" +
"SELECT CASE LOWER(ST_GeometryType(the_geom)) " +
"     WHEN 'st_polygon' THEN 'polygon' " +
"     WHEN 'st_multipolygon' THEN 'polygon' " +
"     WHEN 'st_multilinestring' THEN 'line' " +
"     WHEN 'st_linestring' THEN 'line' " +
"     WHEN 'st_multipoint' THEN 'point' " +
"     WHEN 'st_point' THEN 'point' " +
"     ELSE '' " +
"  END AS the_geom FROM (<%= sql %>) __wrapped"
/* eslint-enable */
);

var MAX_GET_LENGTH = 1024;
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
    simple_geom: '', // , 'point', 'polygon', 'line'
    ready: false // until true there's no data available on the table(s) used in the query
  },

  /**
   * @override {Backbone.prototype.sync} abort ongoing request if there is any
   */
  sync: syncAbort,

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;

    this.on('change', this._onChange, this);
  },

  url: function () {
    return this._configModel.getSqlApiUrl();
  },

  isFetched: function () {
    return this.get('status') === STATUS.fetched;
  },

  isFetching: function () {
    return this.get('status') === STATUS.fetching;
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
    var simpleGeom;

    _.some(r.rows, function (row) {
      return !!(simpleGeom = row.the_geom); // to stop when found a valid simple geom
    });

    return {
      status: STATUS.fetched,
      simple_geom: simpleGeom || ''
    };
  },

  isNew: function () {
    return true; // override Backbone.Model.prototype.isNew for this.destroy() to do its w/o sending a DELETE request
  },

  hasValue: function () {
    return !!this.get('simple_geom');
  },

  _onChange: function () {
    if (!this.hasChanged('status') && this.get('status') === STATUS.fetching) {
      this.fetch(); // If is already fetching just redo the fetch with latest attrs
    } else if (this.hasChanged('query') || this.hasChanged('ready')) {
      this.set('status', this.get('query') ? STATUS.unfetched : STATUS.unavailable);
    }
  },

  _getSqlApiQueryParam: function () {
    return template({
      sql: this.get('query')
    });
  },

  _httpMethod: function () {
    return this._getSqlApiQueryParam().length > MAX_GET_LENGTH
      ? 'POST'
      : 'GET';
  }

});
