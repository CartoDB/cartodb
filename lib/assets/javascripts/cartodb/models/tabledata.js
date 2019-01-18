cdb.admin.CartoDBTableData = cdb.ui.common.TableData.extend({
  _ADDED_ROW_TEXT: 'Row added correctly',
  _ADDING_ROW_TEXT: 'Adding a new row',
  _GEOMETRY_UPDATED: 'Table geometry updated',

  model: cdb.admin.Row,

  initialize: function(models, options) {
    var self = this;
    this.table = options ? options.table: null;
    this.model.prototype.idAttribute = 'cartodb_id';
    this.initOptions();
    this.filter = null;
    this._fetching = false;
    this.pages = [];
    this.lastPage = false;
    this.bind('newPage', this.newPage, this);
    this.bind('reset', function() {
      var pages = Math.floor(this.size()/this.options.get('rows_per_page'))
      this.pages = [];

      for(var i = 0; i < pages; ++i) {
        this.pages.push(i);
      }
    }, this);

    if(this.table) {
      this.bind('add change:the_geom', function(row) {
        var gt = this.table.get('geometry_types')
        if(gt && gt.length > 0) return;
        if(row.get('the_geom')) {
          // we set it to silent because a change in geometry_types
          // raises rendering and column feching
          this.table.addGeomColumnType(row.getGeomType());
        }
      }, this);
    }
    this.elder('initialize');
  },

  initOptions: function() {
    var self = this;
    this.options = new cdb.core.Model({
      rows_per_page:40,
      page: 0,
      sort_order: 'asc',
      order_by: 'cartodb_id',
      filter_column: '',
      filter_value: ''
    });
    this.options.bind('change', function() {
      if(self._fetching) {
        return;
      }
      self._fetching = true;
      opt = {};
      var previous = this.options.previous('page');

      if(this.options.hasChanged('page')) {
        opt.add = true;
        opt.changingPage = true;
        // if user is going backwards insert new rows at the top
        if(previous > this.options.get('page')) {
          opt.at = 0;
        }
      } else {
        if(this.options.hasChanged('mode')) {
          this.options.set({
            'page': 0
          }, { silent: true });
        }
      }

      opt.success = function(_coll, resp) {
        self.trigger('loaded');
        if(resp.rows && resp.rows.length !== 0) {
          if(opt.changingPage) {
            self.trigger('newPage', self.options.get('page'), opt.at === 0? 'up': 'down');
          }
        } else {
          // no data so do not change the page
          self.options.set({page: previous});//, { silent: true });
        }
        self.trigger('endLoadingRows', self.options.get('page'), opt.at === 0? 'up': 'down');
        self._fetching = false;
      };

      opt.error = function() {
        cdb.log.error("there was some problem fetching rows");
        self.trigger('endLoadingRows');
        self._fetching = false;
      };

      self.trigger('loadingRows', opt.at === 0 ? 'up': 'down');
      this.fetch(opt);

    }, this);
  },

  parse: function(d) {
    // when the query modifies the data modified flag is true
    // TODO: change this when SQL API was able to say if a
    // query modify some data
    // HACK, it will fail if using returning sql statement
    this.modify_rows = d.rows.length === 0 && _.size(d.fields) === 0;
    this.affected_rows = d.affected_rows;
    this.lastPage = false;
    if(d.rows.length < this.options.get('rows_per_page')) {
      this.lastPage = true;
    }
    return d.rows;
  },

  // given fields array as they come from SQL create a map name -> type
  _schemaFromQueryFields: function(fields) {
    var sc = {};
    for(k in fields) {
      sc[k] = fields[k].type;
    }
    return sc;
  },

  _createUrlOptions: function(filter) {
    var attr;
    if (filter) {
      var a = {}
      for (var k in this.options.attributes) {
        if (filter(k)) {
          a[k] = this.options.attributes[k];
        }
      }
      attr = _(a);
    } else {
      attr = _(this.options.attributes);
    }
    var params = attr.map(function(v, k) {
      return k + "=" + encodeURIComponent(v);
    }).join('&');
    params += "&api_key=" + cdb.config.get('api_key');
    return params;
  },

  _geometryColumnSQL: function(c) {
      return [
        "CASE",
        "WHEN GeometryType(" + c + ") = 'POINT' THEN",
          "ST_AsGeoJSON(" + c + ",8)",
        "WHEN (" + c + " IS NULL) THEN",
          "NULL",
        "ELSE",
          "GeometryType(" + c + ")",
        "END " + c
      ].join(' ');
  },

  // return wrapped SQL removing the_geom and the_geom_webmercator
  // to avoid fetching those columns.
  // So for a sql like
  // select * from table the returned value is
  // select column1, column2, column3... from table
  wrappedSQL: function(schema, exclude, fetchGeometry) {
    var self = this;
    exclude = exclude || ['the_geom_webmercator'];
    schema = _.clone(schema);

    var select_columns = _.chain(schema).omit(exclude).map(function(v, k) {
      if (v === 'geometry') {
        if(fetchGeometry) {
          return "st_astext(\"" + k + "\") " + "as " + k
        }
        return self._geometryColumnSQL(k);
      }
      return '"' + k + '"';
    }).value();

    select_columns = select_columns.join(',');

    var mode = this.options.get('sort_order') === 'desc' ? 'desc': 'asc';

    var q = "select " + select_columns + " from (" + this.getSQL() + ") __wrapped";
    var order_by = this.options.get('order_by');
    if (order_by && order_by.length > 0) {
      q += " order by " + order_by + " " + mode;
    }
    return q;

  },

  url: function() {
    return this.sqlApiUrl();
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
    if(!options) { options = {}; }
    options.data = this._createUrlOptions(function(d) {
      return d !== 'sql';
    });

    if (cdb.admin.CartoDBTableMetadata.alterTableData(this.options.get('sql') || '')) {
      options.data += "&q=" + encodeURIComponent(this.options.get('sql'));
      options.type = 'POST';
    } else {
      // when a geometry can be lazy fetched, don't fetch it
      var fetchGeometry = 'cartodb_id' in this.query_schema;
      options.data += "&q=" + encodeURIComponent(this.wrappedSQL(this.query_schema, [], !fetchGeometry));

      if (options.data.length > 2048) {
        options.type = 'POST';
      }
    }

    return Backbone.sync.call(this, method, this, options);
  },

  sqlApiUrl: function() {
    return cdb.config.getSqlApiUrl();
  },

  setOptions: function(opt) {
    this.options.set(opt);
  },

  // Refresh all table data
  refresh: function() {
    this.fetch();
  },

  isFetchingPage: function() {
    return this._fetching;
  },

  loadPageAtTop: function() {

    if(!this._fetching) {
      var first = this.pages[0];

      if(first > 0) {
        this.options.set('page', first - 1);
      }
    }
  },

  loadPageAtBottom: function() {
    if(!this._fetching) {
      var last = this.pages[this.pages.length - 1];

      if(!this.lastPage) {
        this.options.set('page', last + 1);
      }
    }
  },

  /**
   * called when a new page is loaded
   * removes the models to max
   */
  newPage: function(currentPage, direction) {
    if(this.pages.indexOf(currentPage) < 0) {
      this.pages.push(currentPage);
    };
     this.pages.sort(function(a, b) {
      return Number(a) > Number(b);
     });
     // remove blocks if there are more rows than allowed
     var rowspp = this.options.get('rows_per_page');
     var max_items = rowspp*4;
     if(this.size() > max_items) {
       if(direction == 'up') {
         // remove page from the bottom (the user is going up)
         this.pages.pop();
         this.remove(this.models.slice(max_items, this.size()));
       } else {
         // remove page from the top (the user is going down)
         this.pages.shift();
         this.remove(this.models.slice(0, rowspp));
       }
     }
  },

  /*setPage: function(p) {
    if(!this._fetching && p >= 0) {
      this.setOptions({page: p});
    }
  },

  getPage: function(p) {
    return this.options.get('page');
  },*/
  addRow: function(opts) {
    var self = this;
    this.table.notice(self._ADDING_ROW_TEXT, 'load', 0)
    var self = this;
    opts = opts || {};
    _.extend(opts, {
      wait: true,
      success: function() {
        self.table.notice(self._ADDED_ROW_TEXT)
      },
      error: function(e, resp) {
        //TODO: notice user
        self.table.error(self._ADDING_ROW_TEXT, resp);
      }
    });
    return this.create(null, opts);
  },

  /**
   * creates a new row model in local, it is NOT serialized to the server
   */
  newRow: function(attrs) {
    r = new cdb.admin.Row(attrs);
    r.table = this.table;
    r.bind('saved', function _saved() {
      if(r.table.data().length == 0) {
        r.table.data().fetch();
        r.unbind('saved', _saved, r.table);
      }
    }, r.table);
    return r;
  },

  /**
   * return a model row
   */
  getRow: function(id, options) {
    options = options || {};
    var r = this.get(id);
    if(!r) {
      r = new cdb.admin.Row({cartodb_id: id});
    }
    if(!options.no_add) {
      this.table._data.add(r);
    }
    r.table = this.table;
    return r;
  },

  getRowAt: function(index) {
    var r = this.at(index);
    r.table = this.table;
    return r;
  },

  deleteRow: function(row_id) {
  },

  isReadOnly: function() {
    return false;
  },

  quartiles: function(nslots, column, callback, error) {
    var tmpl = _.template('select quartile, max(<%= column %>) as maxamount from (select <%= column %>, ntile(<%= slots %>) over (order by <%= column %>) as quartile from (<%= sql %>) _table_sql where <%= column %> is not null) x group by quartile order by quartile');
    this._sqlQuery(tmpl({
      slots: nslots,
      sql: this.getSQL(),
      column: column
    }),
    function(data) {
      callback(_(data.rows).pluck('maxamount'));
    },
    error);
  },

  equalInterval: function(nslots, column, callback, error) {
    var tmpl = _.template(' \
      with params as (select min(a), max(a) from ( select <%= column %> as a from (<%= sql %>) _table_sql where <%= column %> is not null ) as foo ) \
      select (max-min)/<%= slots %> as s, min, max from params'
    );
    this._sqlQuery(tmpl({
      slots: nslots,
      sql: this.getSQL(),
      column: column
    }),
    function(data) {
      var min = data.rows[0].min;
      var max = data.rows[0].max;
      var range = data.rows[0].s;
      var values = [];

      for (var i = 1, l = nslots; i < l; i++) {
        values.push((range*i) + min);
      }

      // Add last value
      values.push(max);
      // Callback
      callback(values);
    },
    error);
  },

  _quantificationMethod: function(functionName, nslots, column, distinct, callback, error) {
    var tmpl = _.template('select unnest(<%= functionName %>(array_agg(<%= simplify_fn %>((<%= column %>::numeric))), <%= slots %>)) as buckets from (<%= sql %>) _table_sql where <%= column %> is not null');
    this._sqlQuery(tmpl({
      slots: nslots,
      sql: this.getSQL(),
      column: column,
      functionName: functionName,
      simplify_fn: 'distinct'
    }),
    function(data) {
      callback(_(data.rows).pluck('buckets'));
    },
    error);
  },

  discreteHistogram: function(nbuckets, column, callback, error) {

    var query = 'SELECT DISTINCT(<%= column %>) AS bucket, count(*) AS value FROM (<%= sql %>) _table_sql GROUP BY <%= column %> ORDER BY value DESC LIMIT <%= nbuckets %> + 1';

    var sql = _.template( query, {
      column: column,
      nbuckets: nbuckets,
      sql: this.getSQL(),
    });

    this._sqlQuery(sql, function(data) {

      var count = data.rows.length;
      var reached_limit = false;

      if (count > nbuckets) {
        data.rows = data.rows.slice(0, nbuckets);
        reached_limit = true;
      }

      callback({ rows: data.rows, reached_limit: reached_limit });

    });

  },

  date_histogram: function(nbuckets, column, callback, error) {

    column = "EXTRACT(EPOCH FROM " + column + "::TIMESTAMP WITH TIME ZONE )";

    var tmpl = _.template(
    'with bounds as ( ' +
     'SELECT  ' +
      'current_timestamp as tz, ' +
      'min(<%= column %>) as lower,  ' +
      'max(<%= column %>) as upper,  ' +
      '(max(<%= column %>) - min(<%= column %>)) as span,  ' +
      'CASE WHEN ABS((max(<%= column %>) - min(<%= column %>))/<%= nbuckets %>) <= 0 THEN 1 ELSE GREATEST(1.0, pow(10,ceil(log((max(<%= column %>) - min(<%= column %>))/<%= nbuckets %>)))) END as bucket_size ' +
      'FROM  (<%= sql %>) _table_sql ' +
    ')  ' +
    'select array_agg(v) val, array_agg(bucket) buckets, tz, bounds.upper, bounds.lower, bounds.span, bounds.bucket_size from ' +
    '( ' +
    'select  ' +
      'count(<%= column %>) as v,   ' +
      'round((<%= column %> - bounds.lower)/bounds.bucket_size) as bucket  ' +
       'from (<%= sql %>) _table_sql, bounds  ' +
       'where <%= column %> is not null ' +
       'group by bucket order by bucket ' +
    ') a, bounds ' +
     'group by ' +
    'bounds.upper, bounds.lower, bounds.span, bounds.bucket_size, bounds.tz ');

    // transform array_agg from postgres to a js array
    function agg_array(a) {
      return a.map(function(v) { return parseFloat(v) });
    }

    this._sqlQuery(tmpl({
      nbuckets: nbuckets,
      sql: this.getSQL(),
      column: column
    }),

    function(data) {

      if (!data.rows || data.rows.length === 0) {
        callback(null, null);
        return;
      }

      var data     = data.rows[0];
      data.val     = agg_array(data.val);
      data.buckets = agg_array(data.buckets);

      var hist   = [];
      var bounds = {};

      // create a sorted array and normalize
      var upper = data.upper;
      var lower = data.lower;
      var span  = data.span;
      var tz    = data.tz;
      var bucket_size = data.bucket_size
      var max, min;

      max = data.val[0];

      for (var r = 0; r < data.buckets.length; ++r) {
        var b = data.buckets[r];
        var v = hist[b] = data.val[r];
        max = Math.max(max, v);
      }

      //var maxBucket = _.max(data.buckets)
      for (var i = 0; i < hist.length; ++i) {
        if (hist[i] === undefined) {
          hist[i] = 0;
        } else {
          hist[i] = hist[i]/max;
        }
      }

      bounds.upper       = parseFloat(upper);
      bounds.lower       = parseFloat(lower);
      bounds.bucket_size = parseFloat(bucket_size)
      bounds.tz          = tz;

      callback(hist, bounds);

    },

    error);
  },

  histogram: function(nbuckets, column, callback, error) {

    var tmpl = _.template(
    'with bounds as ( ' +
     'SELECT  ' +
      'min(<%= column %>) as lower,  ' +
      'max(<%= column %>) as upper,  ' +
      '(max(<%= column %>) - min(<%= column %>)) as span,  ' +
      'CASE WHEN ABS((max(<%= column %>) - min(<%= column %>))/<%= nbuckets %>) <= 0 THEN 1 ELSE GREATEST(1.0, pow(10,ceil(log((max(<%= column %>) - min(<%= column %>))/<%= nbuckets %>)))) END as bucket_size ' +
      'FROM  (<%= sql %>) _table_sql  ' +
    ')  ' +
    'select array_agg(v) val, array_agg(bucket) buckets, bounds.upper, bounds.lower, bounds.span, bounds.bucket_size from ' +
    '( ' +
    'select  ' +
      'count(<%= column %>) as v,   ' +
      'round((<%= column %> - bounds.lower)/bounds.bucket_size) as bucket  ' +
       'from (<%= sql %>) _table_sql, bounds  ' +
       'where <%= column %> is not null ' +
       'group by bucket order by bucket ' +
    ') a, bounds ' +
     'group by ' +
    'bounds.upper, ' +
    'bounds.lower, bounds.span, bounds.bucket_size ');

    // transform array_agg from postgres to a js array
    function agg_array(a) {
      return a.map(function(v) { return parseFloat(v) });
      //return JSON.parse(a.replace('{', '[').replace('}', ']'))
    }

    this._sqlQuery(tmpl({
      nbuckets: nbuckets,
      sql: this.getSQL(),
      column: column
    }),

    function(data) {

      if(!data.rows || data.rows.length === 0) {
        callback(null, null);
        return;
      }

      var data = data.rows[0];

      data.val = agg_array(data.val);
      data.buckets = agg_array(data.buckets);

      var hist = [];
      var bounds = {};

      // create a sorted array and normalize
      var upper = data.upper;
      var lower = data.lower;
      var span = data.span;
      var bucket_size = data.bucket_size
      var max, min;

      max = data.val[0];

      for(var r = 0; r < data.buckets.length; ++r) {
        var b = data.buckets[r];
        var v = hist[b] = data.val[r];
        max = Math.max(max, v);
      }


      //var maxBucket = _.max(data.buckets)
      for (var i = 0; i < hist.length; ++i) {
        if (hist[i] === undefined) {
          hist[i] = 0;
        } else {
          hist[i] = hist[i]/max;
        }
      }

      bounds.upper = parseFloat(upper);
      bounds.lower = parseFloat(lower);
      bounds.bucket_size = parseFloat(bucket_size)

      callback(hist, bounds);

    },

    error);
  },

  jenkBins: function(nslots, column, callback, error) {
    this._quantificationMethod('CDB_JenksBins', nslots, column, true, callback, error);
  },

  headTails: function(nslots, column, callback, error) {
    this._quantificationMethod('CDB_HeadsTailsBins', nslots, column, false, callback, error);
  },

  quantileBins: function(nslots, column, callback, error) {
    this._quantificationMethod('CDB_QuantileBins', nslots, column, false, callback, error);
  },

  categoriesForColumn: function(max_values, column, callback, error) {

    var tmpl = _.template('\
      SELECT <%= column %>, count(<%= column %>) FROM (<%= sql %>) _table_sql ' +
      'GROUP BY <%= column %> ORDER BY count DESC LIMIT <%= max_values %> '
    );

    this._sqlQuery(tmpl({
      sql: this.getSQL(),
      column: column,
      max_values: max_values + 1
    }),
    function(data) {
      callback({
        type: data.fields[column].type || 'string',
        categories: _(data.rows).pluck(column)
      });
    },
    error);

  },

  /**
   * call callback with the geometry bounds
   */
  geometryBounds: function(callback) {
    var tmpl = _.template('SELECT ST_XMin(ST_Extent(the_geom)) as minx,ST_YMin(ST_Extent(the_geom)) as miny, ST_XMax(ST_Extent(the_geom)) as maxx,ST_YMax(ST_Extent(the_geom)) as maxy from (<%= sql %>) _table_sql');
    this._sqlQuery(tmpl({
      sql: this.getSQL()
      }),
      function(result) {
         var coordinates = result.rows[0];

          var lon0 = coordinates.maxx;
          var lat0 = coordinates.maxy;
          var lon1 = coordinates.minx;
          var lat1 = coordinates.miny;

          var minlat = -85.0511;
          var maxlat =  85.0511;
          var minlon = -179;
          var maxlon =  179;

          var clampNum = function(x, min, max) {
            return x < min ? min : x > max ? max : x;
          };

          lon0 = clampNum(lon0, minlon, maxlon);
          lon1 = clampNum(lon1, minlon, maxlon);
          lat0 = clampNum(lat0, minlat, maxlat);
          lat1 = clampNum(lat1, minlat, maxlat);
          callback([ [lat0, lon0], [lat1, lon1]]);
      }
    );
  },

  _sqlQuery: function(sql, callback, error, type) {
    var s = encodeURIComponent(sql);
    return $.ajax({
      type: type || "POST",
      data: "q=" + s + "&api_key=" + cdb.config.get('api_key'),
      url: this.url(),
      success: callback,
      error: error
    });
  },

  getSQL: function() {
    // use table.id to fetch data because if always contains the real table name
    return 'select * from ' + cdb.Utils.safeTableNameQuoting(this.table.get('id'));
  },

  fetch: function(opts) {
    var self = this;
    opts = opts || {};
    if(!opts || !opts.add) {
      this.options.attributes.page = 0;
      this.options._previousAttributes.page = 0;
      this.pages = [];
    }
   var error = opts.error;
    opts.error = function(model, resp) {
      self.fetched = true;
      self.trigger('error', model, resp);
      error && error(model, resp);
    }
    var success = opts.success;
    opts.success = function(model, resp) {
      self.fetched = true;
      success && success.apply(self, arguments);
    }
    this._fetch(opts);
  },

  _fetch: function(opts) {
    var MAX_GET_LENGTH = 1024;
    var self = this;
    this.trigger('loading', opts);

    var sql = this.getSQL();
    // if the query changes the database just send it
    if (cdb.admin.CartoDBTableMetadata.alterTableData(sql)) {
      cdb.ui.common.TableData.prototype.fetch.call(self, opts);
      return;
    }

    // use get to fetch the schema, probably cached
    this._sqlQuery(_.template('select * from (<%= sql %>) __wrapped limit 0')({ sql: sql }), function(data) {
      // get schema
      self.query_schema = self._schemaFromQueryFields(data.fields);
      if (!self.table.isInSQLView()) {
        if ('the_geom' in self.query_schema) {
          delete self.query_schema['the_geom_webmercator'];
        }
      }
      cdb.ui.common.TableData.prototype.fetch.call(self, opts);
    }, function (err) {
      self.trigger('error', self, err);
    }, sql.length > MAX_GET_LENGTH ? "POST" : "GET");
  },

  /**
   * with the data from the rows fetch create an schema
   * if the schema from original table is passed the method
   * set the column types according to it
   * return an empty list if no data was fetch
   */
  schemaFromData: function(originalTableSchema) {
    // build schema in format [ [field, type] , ...]
    return cdb.admin.CartoDBTableMetadata.sortSchema(_(this.query_schema).map(function(v, k) {
      return [k, v];
    }));
  },

  geometryTypeFromGeoJSON: function(geojson) {
    try {
      var geo = JSON.parse(geojson);
      return geo.type
    } catch(e) {
    }
  },

  geometryTypeFromWKT: function(wkt) {
    if(!wkt) return null;
    var types = cdb.admin.WKT.types;
    wkt = wkt.toUpperCase();
    for(var i = 0; i < types.length; ++i) {
      var t = types[i];
      if (wkt.indexOf(t) !== -1) {
        return t;
      }
    }
  },

  geometryTypeFromWKB: function(wkb) {
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
    var geom = row.get('the_geom') || row.get('the_geom_webmercator');
    var geoType = this.geometryTypeFromWKB(geom) || this.geometryTypeFromWKT(geom);
    if(geoType) {
      return ['ST_' + geoType[0].toUpperCase() + geoType.substring(1).toLowerCase()];
    }
    return [];
  },

});
