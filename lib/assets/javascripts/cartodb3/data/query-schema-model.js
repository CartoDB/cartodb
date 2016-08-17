var _ = require('underscore');
var Backbone = require('backbone');
var syncAbort = require('./backbone/sync-abort');
var QueryRowsCollection = require('./query-rows-collection');
var multiline = require('multiline');

var template = _.template(
/* eslint-disable */
multiline(function () {/*!@preserve
SELECT *,
  CASE LOWER(ST_GeometryType(the_geom))
     WHEN 'st_polygon' THEN 'polygon'
     WHEN 'st_multipolygon' THEN 'polygon'
     WHEN 'st_multilinestring' THEN 'line'
     WHEN 'st_linestring' THEN 'line'
     WHEN 'st_multipoint' THEN 'point'
     WHEN 'st_point' THEN 'point'
     ELSE ''
  END AS the_geom FROM (<%= sql %>) __wrapped
*/}).replace(/[\n\t ]+/g, ' ') // convert to one-liner w/ single-spaces
/* eslint-enable */
);

var MAX_GET_LENGTH = 1024;
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
    status: 'unavailable', // , unfetched, fetching, fetched
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
    return this.get('status') === 'fetched';
  },

  canFetch: function () {
    return this.get('query') && !this.isFetched();
  },

  fetch: function (opts) {
    if (!this.canFetch()) return;

    this.set('status', 'fetching');

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
        status: 'unavailable'
      });
    }.bind(this);

    return Backbone.Model.prototype.fetch.call(this, opts);
  },

  parse: function (r) {
    this.rowsSampleCollection.reset(r.rows);

    this.columnsCollection.reset(
      _.map(r.fields, function (d, name) {
        return {
          name: name,
          type: name === 'the_geom' ? 'geometry' : d.type // store type as geometry since we want this info client-side, even though we cast it to a string in the query
        };
      })
    );

    return {
      status: 'fetched',
      simple_geom: this._findSimpleGeom()
    };
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
    return template({
      sql: this.get('query')
    });
  },

  _findSimpleGeom: function () {
    var val;

    this.rowsSampleCollection
      .some(function (row) {
        val = row.get('the_geom');
        return !!val; // to stop when found a valid simple geom
      });

    return val;
  },

  _httpMethod: function () {
    return this._getSqlApiQueryParam().length > MAX_GET_LENGTH
      ? 'POST'
      : 'GET';
  }

});
