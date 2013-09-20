/**
 * contains data for a sql view
 * var s = new cdb.admin.SQLViewData({ sql : "select...." });
 * s.fetch();
 */
cdb.admin.SQLViewData = cdb.admin.CartoDBTableData.extend({

  UNDEFINED_TYPE_COLUMN: 'undefined',

  initialize: function(models, options) {
    // depending on the sql the query is read only or not
    // for example, filter sql should allow edit cells and
    // remove rows
    this.readOnly = true;
    this.model.prototype.idAttribute = 'cartodb_id';
    // this.elder('initialize', models, options);
    cdb.admin.CartoDBTableData.prototype.initialize.call(this, models, options);

    this.bind('error', function() {
      this.reset([]);
    });
    //this.initOptions();
    if(options && options.sql) {
      this.setSQL(options.sql);
    }
  },

  /**
  * we need to override sync to avoid the sql request to be sent by GET.
  * For security reasons, we need them to be send as a PUT request.
  * @method sync
  * @param method {'save' || 'read' || 'delete' || 'create'}
  * @param model {Object}
  * @param options {Object}
  */
  sync: function(method, model, options) {
    if(!options) { options = {}; };
    options.type = 'POST';
    options.data = this._createUrlOptions();
    options.data = options.data.replace(/sql=/, 'q=');
    return Backbone.sync.call(this, method, this, options)
  },

  _parseSQL: function(sql) {
    sql = sql.replace(/([^\\]){x}/g, '$10').replace(/\\{x}/g, '{x}')
    sql = sql.replace(/([^\\]){y}/g, '$10').replace(/\\{y}/g, '{y}')
    sql = sql.replace(/([^\\]){z}/g, '$10').replace(/\\{z}/g, '{z}')

    // Substitute mapnik tokens
    // resolution at zoom level 0
    var res = '156543.03515625';
    // full webmercator extent
    var ext = 'ST_MakeEnvelope(-20037508.5,-20037508.5,20037508.5,20037508.5,3857)';
    sql = sql.replace('!bbox!', ext)
             .replace('!pixel_width!', res)
             .replace('!pixel_height!', res);

    return sql
  },

  sqlSource: function() {
    return this.options.get('sql_source');
  },

  setSQL: function(sql, opts) {
    opts = opts || {}
    this.readOnly = true;
    // reset options whiout changing raising a new fetchs
    this.options.set({
      page: 0,
      mode: 'asc',
      order_by: '',
      filter_column: '',
      filter_value: '',
      sql_source: opts.sql_source || null
    }, { silent: true } );

    var silent = opts.silent;
    opts.silent = true;
    this.options.set({ sql : sql ? this._parseSQL(sql): '' }, opts);
    if(!silent) {
      this.options.trigger('change:sql', this.options, sql);
    }
  },

  getSQL: function() {
    return this.options.get('sql');
  },

  /**
   * with the data from the rows fetch create an schema
   * if the schema from original table is passed the method
   * set the column types according to it
   * return an empty list if no data was fetch
   */
  schemaFromData: function(originalTableSchema) {
    return this.query_schema;
  },

  geometryTypeFromWBK: function(wkb) {
    if(!wkb) return null;

    var typeMap = {
      '0001': 'Point',
      '0002': 'LineString',
      '0003': 'Polygon',
      '0004': 'MultiPoint',
      '0005': 'MultiLineString',
      '0006': 'MultiPolygon'
    };

    var bigendian = wkb[0] === '0' && wkb[1] === '0';
    var type = wkb.substring(2, 6);
    if(!bigendian) {
      // swap '0100' => '0001'
      type = type[2] + type[3] + type[0] + type[1];
    }
    return typeMap[type];

  },


  //
  // guesses from the first row the geometry types involved
  // returns an empty array where there is no rows
  // return postgist types, like st_GEOTYPE
  //
  getGeometryTypes: function() {
    var row = null;
    var i = this.size();
    while (i-- && !(row && row.get('the_geom'))) {
      row = this.at(i);
    }
    if(!row) return [];
    var geoType = this.geometryTypeFromWBK(row.get('the_geom') || row.get('the_geom_webmercator'));
    if(geoType) {
      return ['ST_' + geoType[0].toUpperCase() + geoType.substring(1).toLowerCase()];
    }
    return [];
  },

  fetch: function(opts) {
    this.trigger('loading', opts);
    //this.reset([], { silent: true });
    this.elder('fetch', opts);
  },

  url: function() {
    return this.sqlApiUrl();
  },

  isReadOnly: function() {
    return this.readOnly;
  },

  filterColumnSQL: function(columnName, tableName, filter, columnType) {
    columnType = columnType || 'string'
    var sql = "SELECT * from <%= table %> where <%= column %> ilike '%<%=filter%>%'";
    if(columnType === 'number') {
      sql = "SELECT * from <%= table %> where <%= column %> = <%= filter %>"
    } else if (columnType === 'boolean') {
      if(filter != 'true') {
        filter = 'false'
      }
      sql = "SELECT * from <%= table %> where <%= column %> = <%= filter %>"
    }

    return _.template(sql, {
      column: columnName,
      table: tableName,
      filter: filter
    });
  },

  filterColumn: function(columnName, tableName, filter) {
    // filter table by column
    this.setSQL(this.filterColumnSQL(columnName, tableName, filter));
    this.readOnly = false;
  },

  quartiles: function(nslots, column, callback, error) {
    var tmpl = _.template('SELECT quartile, max(<%= column %>) as maxAmount FROM (SELECT <%= column %>, ntile(<%= slots %>) over (order by <%= column %>) as quartile FROM (<%= sql %>) as _rambo WHERE <%= column %> IS NOT NULL) x GROUP BY quartile ORDER BY quartile');
    this._sqlQuery(tmpl({
      slots: nslots,
      sql: this.options.get('sql'),
      column: column
    }),
    function(data) {
      callback(_(data.rows).pluck('maxamount'));
    },
    error);
  },

  // returns if the query contains geo data
  isGeoreferenced: function() {
    if(this.size()) {
      return this.models.some(function(row, i, a) {
        return row.hasGeometry();
      })

    }
    return false;
  }

  /*url: function() {
    if(!this.sql) {
      throw "sql must be provided";
    }
    return '/api/v1/queries?sql=' +
      encodeURIComponent(this.sql) +
      '&limit=20&rows_per_page=40&page=0'
  }*/

});
