
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
    if(this.table) {
      this.linkToSchema();
    }
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
      mode: 'asc',
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

  /**
   * when the schema changes the data is not refetched
   */
  unlinkFromSchema: function() {
    this.table.unbind('change', null, this);
  },

  /**
   * when the schema changes the data is fetched again
   */
  linkToSchema: function() {
    var self = this;
    function needsFetch(table) {
      // if the change only affects to geometry_types do not
      // refresh
      var ca = table.changedAttributes();
      if (ca.geometry_types && _.keys(ca).length === 1) {
        return false;
      }
      return true;
    }
    this.table.bind('change', function() {
      if (needsFetch(self.table) && self.table.get('name')) {
        self.fetch();
      }
    }, this);
  },

  parse: function(d) {
    // when the query modifies the data modified flag is true
    // TODO: change this when SQL API was able to say if a
    // query modify some data
    // HACK, it will fail if using returning sql statement
    this.modify_rows = d.rows.length === 0 && _.size(d.fields) === 0
    this.affected_rows = d.affected_rows;
    this.lastPage = false;
    if(d.fields) {
      // build schema in format [ [field, type] , ...]
      this.query_schema = _(d.fields).map(function(v, k) {
        return [k, v.type];
      });
    }
    if(d.rows.length < this.options.get('rows_per_page')) {
      this.lastPage = true;
    }
    return d.rows;
  },

  _createUrlOptions: function() {
    var params = _(this.options.attributes).map(function(v, k) {
      return k + "=" + encodeURIComponent(v);
    }).join('&');
    params += "&api_key=" + cdb.config.get('api_key');
    return params;
  },

  url: function() {
    var u = this.sqlApiUrl();
    u += "?" + this._createUrlOptions();

    var columns = _(this.table.columnNames()).reject(function(c) {
      return c === 'the_geom_webmercator' || c === 'the_geom';
    });

    var select_columns = columns.map(function(a) {
      return '"' + a + '"';
    });

    if (this.table.containsColumn('the_geom')) {
      select_columns.push([
        "CASE",
        "WHEN GeometryType(the_geom) = 'POINT' THEN",
          "ST_AsGeoJSON(the_geom,8)",
        "WHEN (the_geom IS NULL) THEN",
          "NULL",
        "ELSE",
          "'GeoJSON'",
        "END the_geom",
      ].join(' '));
    }

    select_columns = select_columns.join(',');

    u += "&q=" + encodeURIComponent("select " + select_columns + " from " + this.table.get('name') + " order by cartodb_id");
    return u;
  },

  sync: function(method, model, options) {
    if(!options) { options = {}; };
    // use GET, we should maybe use post but it's hard the table sql 
    // reach the maximum query data.
    options.type = 'GET';
    return Backbone.sync.call(this, method, this, options);
  },

  sqlApiUrl: function() {
    var protocol = cdb.config.get("sql_api_port") == 443 ? 'https': 'http';
    var u = protocol + "://" + cdb.config.get('user_name') + "." + cdb.config.get('sql_api_domain');
    u += ":" + cdb.config.get('sql_api_port');
    u += cdb.config.get('sql_api_endpoint');
    return u;
  },

  setOptions: function(opt) {
    this.options.set(opt);
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
    r.bind('saved', function() {
      if(r.table.data().length == 0) {
        r.table.fetch();
        r.unbind('saved', null, r.table);
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

  _sqlQuery: function(sql, callback, error) {
    var s = encodeURIComponent(sql);
    return $.ajax({
      type: "POST",
      data: "q=" + s + "&api_key=" + cdb.config.get('api_key'),
      url: this.sqlApiUrl(),
      success: callback,
      error: error
    });
  },

  getSQL: function() {
    return "select * from " + this.table.get('name');
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
    this.elder('fetch', opts);
  }

});

