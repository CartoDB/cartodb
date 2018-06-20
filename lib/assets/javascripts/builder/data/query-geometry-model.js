var _ = require('underscore');
var Backbone = require('backbone');
var BaseModel = require('./query-base-model');
var STATUS = require('./query-base-status');
/* eslint-disable */
var template = _.template("" +
"SELECT CASE LOWER(ST_GeometryType(<%= geom_column %>)) " +
"     WHEN 'st_polygon' THEN 'polygon' " +
"     WHEN 'st_multipolygon' THEN 'polygon' " +
"     WHEN 'st_multilinestring' THEN 'line' " +
"     WHEN 'st_linestring' THEN 'line' " +
"     WHEN 'st_multipoint' THEN 'point' " +
"     WHEN 'st_point' THEN 'point' " +
"     ELSE '' " +
"  END AS the_geom FROM (<%= sql %>) __wrapped WHERE <%= geom_column %> IS NOT NULL"
/* eslint-enable */
);

var THE_GEOM_NOT_FOUND_ERROR = 'column \"the_geom\" does not exist';
var PARAMS = {
  sort_order: 'asc',
  rows_per_page: 40,
  page: 0
};
var GEOMETRIES = {
  LINE: 'line',
  POINT: 'point',
  POLYGON: 'polygon'
};

/**
 * Model to represent a schema of a SQL query.
 */
module.exports = BaseModel.extend({

  defaults: {
    query: '',
    status: STATUS.initial,
    simple_geom: '', // , 'point', 'polygon', 'line'
    ready: false // until true there's no data available on the table(s) used in the query
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    BaseModel.prototype.initialize.call(this, attrs, opts);

    this._configModel = opts.configModel;

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
        api_key: this._configModel.get('api_key'),
        q: this._getSqlApiQueryParam(opts.geomColumnName)
      },
      PARAMS
    );

    opts.method = this._httpMethod();

    opts.success = function (model, response) {
      this._resetRepeatedError();
      if (successCallback) { successCallback(response); }
    }.bind(this);

    opts.error = function (model, response) {
      if (response && response.statusText !== 'abort') {
        var error = response.responseText ? JSON.parse(response.responseText).error : [];
        // in case we get an error of the_geom does not exists try with the_geom_webmercator to get the geometry type
        if (error.length === 1 && error[0] === THE_GEOM_NOT_FOUND_ERROR) {
          this.fetch(_.extend({}, _.omit(opts, 'success'), { originalError: opts.errorCallback, geomColumnName: 'the_geom_webmercator' }));
        } else {
          this._incrementRepeatedError();

          this.set({
            simple_geom: '',
            query_errors: error,
            status: this.hasRepeatedErrors() ? STATUS.errored : STATUS.unavailable
          });

          if (opts.errorCallback) {
            opts.errorCallback({
              status: response.status || 'Unknown',
              error: error
            });
          }
        }
      }
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

  hasValue: function () {
    throw new Error('QueryGeometryModel.hasValue() is an async operation. Use `.hasValueAsync` instead.');
  },

  hasValueAsync: function () {
    var self = this;
    if (this.isFetched()) {
      return Promise.resolve(!!this.get('simple_geom'));
    } else {
      return new Promise(function (resolve) {
        self.listenToOnce(self, 'inFinalStatus', function () {
          resolve(!!self.get('simple_geom'));
        });
      });
    }
  },

  _onChange: function () {
    this._removeChangeListener();

    if (!this.hasChanged('status') && this.get('status') === STATUS.fetching) {
      // If it is already fetching just redo the fetch with latest attrs
      // in case the query has changed
      if (this.hasChanged('query')) {
        this.fetch();
      }
    } else if (this.hasChanged('query') || this.hasChanged('ready')) {
      this.set('status', this.get('query') ? STATUS.unfetched : STATUS.unavailable, { silent: true });
    }

    this._addChangeListener();
  },

  _getSqlApiQueryParam: function (geomColumnName) {
    return template({
      geom_column: geomColumnName || 'the_geom',
      sql: this.get('query')
    });
  },

  isPolygon: function () {
    return this.get('simple_geom') === GEOMETRIES.POLYGON;
  }
});
