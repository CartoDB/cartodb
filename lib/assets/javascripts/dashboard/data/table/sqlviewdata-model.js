const _ = require('underscore');
const CartoTableData = require('dashboard/data/table/carto-table-data');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

/**
 * contains data for a sql view
 * var s = new cdb.admin.SQLViewData({ sql : "select...." });
 * s.fetch();
 */
module.exports = CartoTableData.extend({

  UNDEFINED_TYPE_COLUMN: 'undefined',

  initialize: function (models, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    this.model.prototype.idAttribute = 'cartodb_id';
    CartoTableData.prototype.initialize.call(this, models, options);

    this.bind('error', function () {
      this.reset([]);
    });
    // this.initOptions();
    if (options && options.sql) {
      this.setSQL(options.sql);
    }
  },

  _parseSQL: function (sql) {
    sql = sql.replace(/([^\\]){x}/g, '$10').replace(/\\{x}/g, '{x}');
    sql = sql.replace(/([^\\]){y}/g, '$10').replace(/\\{y}/g, '{y}');
    sql = sql.replace(/([^\\]){z}/g, '$10').replace(/\\{z}/g, '{z}');

    // Substitute mapnik tokens
    // resolution at zoom level 0
    var res = '156543.03515625';
    // full webmercator extent
    var ext = 'ST_MakeEnvelope(-20037508.5,-20037508.5,20037508.5,20037508.5,3857)';
    sql = sql.replace('!bbox!', ext)
      .replace('!pixel_width!', res)
      .replace('!pixel_height!', res);

    return sql;
  },

  sqlSource: function () {
    return this.options.get('sql_source');
  },

  setSQL: function (sql, opts) {
    opts = opts || {};
    // reset options whiout changing raising a new fetchs
    this.options.set({
      page: 0,
      sort_order: 'asc',
      order_by: '',
      filter_column: '',
      filter_value: '',
      sql_source: opts.sql_source || null
    }, { silent: true });

    var silent = opts.silent;
    opts.silent = true;
    this.options.set({ sql: sql ? this._parseSQL(sql) : '' }, opts);
    if (!silent) {
      this.options.trigger('change:sql', this.options, sql);
    }
  },

  getSQL: function () {
    return this.options.get('sql');
  },

  url: function () {
    return this.sqlApiUrl();
  },

  isReadOnly: function () {
    return this.sqlSource() !== 'filters';
  },

  quartiles: function (nslots, column, callback, error) {
    var tmpl = _.template('SELECT quartile, max(<%= column %>) as maxAmount FROM (SELECT <%= column %>, ntile(<%= slots %>) over (order by <%= column %>) as quartile FROM (<%= sql %>) as _rambo WHERE <%= column %> IS NOT NULL) x GROUP BY quartile ORDER BY quartile');
    this._sqlQuery(tmpl({
      slots: nslots,
      sql: this.options.get('sql'),
      column: column
    }),
    function (data) {
      callback(_(data.rows).pluck('maxamount'));
    },
    error);
  },

  // returns if the query contains geo data
  isGeoreferenced: function () {
    return this.getGeometryTypes().length > 0;
  }
});
