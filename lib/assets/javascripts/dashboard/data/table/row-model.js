const _ = require('underscore');
const Backbone = require('backbone');
const SQL = require('internal-carto.js').SQL;
const WKT = require('dashboard/common/wkt');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

const RESERVED_COLUMNS = 'the_geom the_geom_webmercator cartodb_id created_at updated_at'.split(' ');

module.exports = Backbone.Model.extend({

  _GEOMETRY_TYPES: {
    'point': 'st_point',
    'multipoint': 'st_multipoint',
    'linestring': 'st_linestring',
    'multilinestring': 'st_multilinestring',
    'polygon': 'st_polygon',
    'multipolygon': 'st_multipolygon'
  },

  initialize: function (attrs, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  url: function (method) {
    var version = this._configModel.urlVersion('record', method);
    var table = this.table || this.collection.table;
    if (!table) {
      console.error('row has no table assigned');
    }

    var base = '/api/' + version + '/tables/' + table.get('name') + '/records/';
    if (this.isNew()) {
      return base;
    }
    return base + this.id;
  },

  fetch: function (opts) {
    opts = opts || {};
    var username = (this.options && this.options.user_data) ? this.options.user_data.username
      : (window.user_data ? window.user_data.username : window.user_name);
    var api_key = (this.options && this.options.user_data) ? this.options.user_data.api_key
      : (window.user_data ? window.user_data.api_key : window.api_key);

    var table = this.table || this.collection.table;

    var sqlApi = new SQL({
      user: username,
      version: 'v2',
      api_key: api_key,
      sql_api_template: this._configModel.getSqlApiBaseUrl(),
      extra_params: ['skipfields']
    });
    // this.trigger('loading')
    var sql = null;
    var columns = table.columnNames();
    if (opts.no_geom) {
      columns = _.without(columns, 'the_geom', 'the_geom_webmercator');
    } else {
      columns = _.without(columns, 'the_geom');
    }
    sql = 'SELECT ' + columns.join(',') + ' ';
    if (table.containsColumn('the_geom') && !opts.no_geom) {
      sql += ',ST_AsGeoJSON(the_geom, 8) as the_geom ';
    }
    sql += ' from (' + table.data().getSQL() + ') _table_sql WHERE cartodb_id = ' + this.get('cartodb_id');
    // Added opts to sql execute function to apply
    // parameters ( like cache ) to the ajax request
    if (opts.no_geom) {
      opts.skipfields = 'the_geom,the_geom_webmercator';
    } else {
      opts.skipfields = 'the_geom_webmercator';
    }
    sqlApi.execute(sql, {}, opts).done(function (data) {
      if (this.parse(data.rows[0])) {
        this.set(data.rows[0]);//, {silent: silent});
        this.trigger('sync');
      }
    });
  },

  toJSON: function () {
    var attr = _.clone(this.attributes);
    // remove read-only attributes
    delete attr['updated_at'];
    delete attr['created_at'];
    delete attr['the_geom_webmercator'];
    if (!this.isGeometryGeoJSON()) {
      delete attr['the_geom'];
    }
    return attr;
  },

  isGeomLoaded: function () {
    var geojson = this.get('the_geom');
    var column_types_WKT = WKT.types;
    return (geojson !== 'GeoJSON' && geojson !== -1 && !_.contains(column_types_WKT, geojson));
  },

  hasGeometry: function () {
    var the_geom = this.get('the_geom');
    return !!(the_geom != null && the_geom != undefined && the_geom != ''); // eslint-disable-line eqeqeq
  },
  /**
   * Checks if the_geom contains a valid geoJson
   */
  isGeometryGeoJSON: function () {
    var the_geom = this.get('the_geom');
    if (the_geom && typeof the_geom === 'object') {
      return !!the_geom.coordinates;
    } else if (typeof the_geom !== 'string') {
      return false;
    }
    // if the geom contains GeoJSON, the row has a valid geometry, but is not loaded yet
    if (the_geom === 'GeoJSON') {
      return true;
    }

    try {
      var g = JSON.parse(the_geom);
      return !!g.coordinates;
    } catch (e) {
      return false;
    }
  },

  getFeatureType: function () {
    if (this.isGeomLoaded()) {
      // Problem geometry type from a WKB format
      // Not possible for the moment
      try {
        var geojson = JSON.parse(this.get('the_geom'));
        return geojson.type.toLowerCase();
      } catch (e) {
        console.info('Not possible to parse geometry type');
      }
    }
    return null;
  },

  getGeomType: function () {
    try {
      return this._GEOMETRY_TYPES[this.getFeatureType()];
    } catch (e) {
      console.info('Not possible to parse geometry type');
    }
  }

}, {
  RESERVED_COLUMNS,
  isReservedColumn: function (c) {
    return _(RESERVED_COLUMNS).indexOf(c) !== -1;
  }
});
