
;(function() {

  var root = this;

  root.cartodb = root.cartodb || {};

  function SQL(options) {
    if(cartodb === this || window === this) {
      return new SQL(options);
    }
    if(!options.user) {
      throw new Error("user should be provided");
    }
    var loc = new String(window.location.protocol);
    loc = loc.slice(0, loc.length - 1);
    if(loc == 'file') {
      loc = 'https';
    }

    this.ajax = options.ajax || (typeof(jQuery) !== 'undefined' ? jQuery.ajax: reqwest);
    if(!this.ajax) {
      throw new Error("jQuery or reqwest should be loaded");
    }

    this.options = _.defaults(options, {
      version: 'v2',
      protocol: loc,
      jsonp: typeof(jQuery) !== 'undefined' ? !jQuery.support.cors: false
    })

    if (!this.options.sql_api_template) {
      var opts = this.options;
      var template = null;
      if(opts && opts.completeDomain) {
        template = opts.completeDomain;
      } else {
        var host = opts.host || 'cartodb.com';
        var protocol = opts.protocol || 'https';
        template = protocol + '://{user}.' + host;
      }
      this.options.sql_api_template = template;
    }
  }

  SQL.prototype._host = function() {
    var opts = this.options;
    return opts.sql_api_template.replace('{user}', opts.user) + '/api/' +  opts.version + '/sql';
  },

  /**
   * var sql = new SQL('cartodb_username');
   * sql.execute("select * form {table} where id = {id}", {
   *    table: 'test',
   *    id: '1'
   * })
   */
  SQL.prototype.execute = function(sql, vars, options, callback) {

    //Variable that defines if a query should be using get method or post method
    var MAX_LENGTH_GET_QUERY = 1024;

    var promise = new cartodb._Promise();
    if(!sql) {
      throw new TypeError("sql should not be null");
    }
    // setup arguments
    var args = arguments,
    fn = args[args.length -1];
    if(_.isFunction(fn)) {
      callback = fn;
    }
    options = _.defaults(options || {}, this.options);
    var params = {
      type: 'get',
      dataType: 'json',
      crossDomain: true
    };

    if(options.cache !== undefined) {
      params.cache = options.cache; 
    }

    if(options.jsonp) {
      delete params.crossDomain;
      if (options.jsonpCallback) {
        params.jsonpCallback = options.jsonpCallback;
      }
      params.dataType = 'jsonp';
    }

    // Substitute mapnik tokens
    // resolution at zoom level 0
    var res = '156543.03515625';
    // full webmercator extent
    var ext = 'ST_MakeEnvelope(-20037508.5,-20037508.5,20037508.5,20037508.5,3857)';
    sql = sql.replace('!bbox!', ext)
             .replace('!pixel_width!', res)
             .replace('!pixel_height!', res);

    // create query
    var query = Mustache.render(sql, vars);

    // check method: if we are going to send by get or by post
    var isGetRequest = query.length < MAX_LENGTH_GET_QUERY;

    // generate url depending on the http method
    var reqParams = ['format', 'dp', 'api_key'];
    // request params
    if (options.extra_params) {
      reqParams = reqParams.concat(options.extra_params);
    }

    params.url = this._host() ;
    if (isGetRequest) {
      var q = 'q=' + encodeURIComponent(query);
      for(var i in reqParams) {
        var r = reqParams[i];
        var v = options[r];
        if(v) {
          q += '&' + r + "=" + v;
        }
      }

      params.url += '?' + q;
    } else {
      var objPost = {'q': query};
      for(var i in reqParams) {
        var r = reqParams[i];
        var v = options[r];
        if (v) {
          objPost[r] = v;
        }
      }

      params.data = objPost;
      //Check if we are using jQuery(uncompressed) or reqwest (core)
      if ((typeof(jQuery) !== 'undefined')) {
        params.type = 'post';
      } else {
        params.method = 'post'; 
      }
    }

    // wrap success and error functions
    var success = options.success;
    var error = options.error;
    if(success) delete options.success;
    if(error) delete error.success;

    params.error = function(resp) {
      var res = resp.responseText || resp.response;
      var errors = res && JSON.parse(res);
      promise.trigger('error', errors && errors.error, resp)
      if(error) error(resp);
    }
    params.success = function(resp, status, xhr) {
      // manage rewest
      if(status == undefined) {
        status = resp.status;
        xhr = resp;
        resp = JSON.parse(resp.response);
      }
      //Timeout explanation. CartoDB.js ticket #336
      //From St.Ov.: "what setTimeout does is add a new event to the browser event queue 
      //and the rendering engine is already in that queue (not entirely true, but close enough) 
      //so it gets executed before the setTimeout event."
      setTimeout(function() {
        promise.trigger('done', resp, status, xhr);
        if(success) success(resp, status, xhr);
        if(callback) callback(resp);
      }, 0);
    }

    // call ajax
    delete options.jsonp;
    this.ajax(_.extend(params, options));
    return promise;
  }

  SQL.prototype.getBounds = function(sql, vars, options, callback) {
      var promise = new cartodb._Promise();
      var args = arguments,
      fn = args[args.length -1];
      if(_.isFunction(fn)) {
        callback = fn;
      }
      var s = 'SELECT ST_XMin(ST_Extent(the_geom)) as minx,' +
              '       ST_YMin(ST_Extent(the_geom)) as miny,'+
              '       ST_XMax(ST_Extent(the_geom)) as maxx,' +
              '       ST_YMax(ST_Extent(the_geom)) as maxy' +
              ' from ({{{ sql }}}) as subq';
      sql = Mustache.render(sql, vars);
      this.execute(s, { sql: sql }, options)
        .done(function(result) {
          if (result.rows && result.rows.length > 0 && result.rows[0].maxx != null) {
            var c = result.rows[0];
            var minlat = -85.0511;
            var maxlat =  85.0511;
            var minlon = -179;
            var maxlon =  179;

            var clamp = function(x, min, max) {
              return x < min ? min : x > max ? max : x;
            }

            var lon0 = clamp(c.maxx, minlon, maxlon);
            var lon1 = clamp(c.minx, minlon, maxlon);
            var lat0 = clamp(c.maxy, minlat, maxlat);
            var lat1 = clamp(c.miny, minlat, maxlat);

            var bounds = [[lat0, lon0], [lat1, lon1]];
            promise.trigger('done', bounds);
            callback && callback(bounds);
          }
        })
        .error(function(err) {
          promise.trigger('error', err);
        })

      return promise;

  }

  /**
   * var people_under_10 = sql
   *    .table('test')
   *    .columns(['age', 'column2'])
   *    .filter('age < 10')
   *    .limit(15)
   *    .order_by('age')
   *
   *  people_under_10(function(results) {
   *  })
   */

  SQL.prototype.table = function(name) {

    var _name = name;
    var _filters;
    var _columns = [];
    var _limit;
    var _order;
    var _orderDir;
    var _sql = this;

    function _table() {
      _table.fetch.apply(_table, arguments);
    }

    _table.fetch = function(vars) {
      vars = vars || {}
      var args = arguments,
      fn = args[args.length -1];
      if(_.isFunction(fn)) {
        callback = fn;
        if(args.length === 1) vars = {};
      }
      _sql.execute(_table.sql(), vars, callback);
    }

    _table.sql = function() {
      var s = "select"
      if(_columns.length) {
        s += ' ' + _columns.join(',') + ' '
      } else {
        s += ' * '
      }

      s += "from " + _name;

      if(_filters) {
        s += " where " + _filters;
      }
      if(_limit) {
        s += " limit " + _limit;
      }
      if(_order) {
        s += " order by " + _order;
      }
      if(_orderDir) {
        s += ' ' + _orderDir;
      }

      return s;
    }

    _table.filter = function(f) {
      _filters = f;
      return _table;
    }

    _table.order_by= function(o) {
      _order = o;
      return _table;
    }
    _table.asc = function() {
      _orderDir = 'asc'
      return _table;
    }

    _table.desc = function() {
      _orderDir = 'desc'
      return _table;
    }

    _table.columns = function(c) {
      _columns = c;
      return _table;
    }

    _table.limit = function(l) {
      _limit = l;
      return _table;
    }

    return _table;

  }


  /*
   * sql.filter(sql.f().distance('< 10km')
   */
  /*cartodb.SQL.geoFilter = function() {
    var _sql;
    function f() {}

    f.distance = function(qty) {
      qty.replace('km', '*1000')
      _sql += 'st_distance(the_geom) ' + qty
    }
    f.or = function() {
    }

    f.and = function() {
    }
    return f;
  }
  */
  function array_agg(s) {
    return JSON.parse(s.replace(/^{/, '[').replace(/}$/, ']'));
  }


  SQL.prototype.describeString = function(sql, column, options, callback) {

      var s = [
      'WITH c As (',
        '  select count(*) as total',
        '  from ({{sql}}) _wrap',
        ' ),',
        ' a As (',
        '  SELECT', 
        '  count(*) cnt,',
        '  {{column}}', 
        ' from ({{sql}}) _wrap ', 
        ' GROUP BY {{column}}', 
        ' ORDER BY cnt DESC',
        ' ),', 
        ' b As (', 
        ' SELECT', 
        ' sum(cnt) OVER (ORDER BY cnt DESC) / c.total As cumsum', 
        ' FROM a, c', 
        ' LIMIT 10', 
        ' ),', 
        // ' m As (SELECT max(cumsum) cat_weight FROM b),',
        'stats as (', 
           'select count(distinct({{column}})) as uniq, ',
           '       count(*) as cnt, ',
           '       sum(case when {{column}} is null then 1 else 0 end)::numeric / count(*)::numeric as count_nulls, ',
           // '       CDB_DistinctMeasure(array_agg({{column}}::text)) as cat_weight ',
           '       (SELECT max(cumsum) cat_weight FROM b) cat_weight ',
           'from ({{sql}}) __wrap',
        '),',
        'hist as (', 
           'select array_agg(row(d, c)) from (select distinct({{column}}) d, count(*) as c from ({{sql}}) __wrap, stats group by 1 limit 100) _a',
        ')',
        'select * from stats, hist'
      ];

      var query = Mustache.render(s.join('\n'), {
        column: column, 
        sql: sql
      });
      this.execute(query, function(data) {
        var s = array_agg(data.rows[0].array_agg);
        callback({
          type: 'string',
          hist: _(s).map(function(row) {
            var r = row.match(/\((.*),(\d+)/);
            return [r[1], +r[2]];
          }),
          distinct: data.rows[0].uniq,
          count_nulls: data.rows[0].count_nulls,
          cat_weight: data.rows[0].cat_weight,
          passes: (data.rows[0].uniq > 1 && data.rows[0].cat_weight > 0.66 && data.rows[0].count_nulls < 0.1),
          weight: 1/3 * ( (data.rows[0].uniq > 1 && data.rows[0].uniq < 10) ? (1) : (data.rows[0].uniq >= 10 && data.rows[0].uniq < 20 ? (0.8) : (data.rows[0].uniq > 20 && data.rows[0].uniq < 100 ? 0.5 : 0.1)) 
                         + data.rows[0].cat_weight 
                         + data.rows[0].count_nulls )
        });
      });
  }

  SQL.prototype.describeGeom = function(sql, column, options, callback) {
      var s = [
        'with stats as (', 
           'select st_asgeojson(st_extent({{column}})) as bbox',
           'from ({{sql}}) _wrap',
        '),',
        'geotype as (', 
          'select st_geometrytype({{column}}) as geometry_type from ({{sql}}) _w where {{column}} is not null limit 1',
        ')',
        'select * from stats, geotype'
      ];

      var query = Mustache.render(s.join('\n'), {
        column: column, 
        sql: sql
      });
      function simplifyType(g) {
        return { 
        'st_multipolygon': 'polygon',
        'st_polygon': 'polygon',
        'st_multilinestring': 'line',
        'st_linestring': 'line',
        'st_multipoint': 'point',
        'st_point': 'point'
        }[g.toLowerCase()]
      };

      this.execute(query, function(data) {
        var row = data.rows[0];
        var bbox = JSON.parse(row.bbox).coordinates[0]
        callback({
          type: 'geom',
          //lon,lat -> lat, lon
          bbox: [[bbox[0][1],bbox[0][0]], [bbox[2][1], bbox[2][0]]],
          geometry_type: row.geometry_type,
          simplified_geometry_type: simplifyType(row.geometry_type)
        });
      });
  }

  SQL.prototype.columns = function(sql, options, callback) {
    var args = arguments,
        fn = args[args.length -1];
    if(_.isFunction(fn)) {
      callback = fn;
    }
    var s = "select * from (" + sql + ") __wrap limit 0";
    this.execute(s, function(data) {
      var t = {}
      for (var i in data.fields) {
        t[i] = data.fields[i].type;
      }
      callback(t);
    });
  };

  SQL.prototype.describeFloat = function(sql, column, options, callback) {
      var s = [
        'with stats as (',
            'select min("{{column}}") as min,',
                   'max("{{column}}") as max,',
                   'avg("{{column}}") as avg,',
                   'stddev("{{column}}") as stddev,',
                   'stddev("{{column}}") / abs(avg("{{column}}")) as stddevmean, ',
                   ' \'F\' as dist_type ',
                   // CDB_DistType needs to be in production before using
                   // 'CDB_DistType(array_agg("{{column}}"::numeric)) as dist_type ',
              'from ({{sql}}) _wrap ',
              'where {{column}} is not null ',
        '),',
        'params as (select min(a) as min, (max(a) - min(a)) / 7 as diff from ( select {{column}} as a from ({{sql}}) _table_sql where {{column}} is not null ) as foo ),',
         'histogram as (',
           'select array_agg(row(bucket, range, freq)) as hist from (',
           'select width_bucket({{column}}, min, max, 100) as bucket,',
                  'numrange(min({{column}})::numeric, max({{column}})::numeric) as range,',
                  'count(*) as freq',
             'from ({{sql}}) _w, stats',
             'group by 1',
             'order by 1',
          ') __wrap',
         '),',
         'buckets as (',
            'select CDB_QuantileBins(array_agg({{column}}::numeric), 7) as quantiles, ',
            '       (select array_agg(x::numeric) FROM (SELECT (min + n * diff)::numeric as x FROM generate_series(1,7) n, params) p) as equalint,',
            // '       CDB_EqualIntervalBins(array_agg({{column}}::numeric), 7) as equalint, ',
            '       CDB_JenksBins(array_agg({{column}}::numeric), 7) as jenks, ',
            '       CDB_HeadsTailsBins(array_agg({{column}}::numeric), 7) as headtails ',
            'from ({{sql}}) _table_sql where {{column}} is not null',
         ')',
         'select * from histogram, stats, buckets'
      ];

      // if(normalization == '_area'){
      //   var wrap_sql = "SELECT {{column}}/ST_Area(the_geom::geography) as _target_column FROM ({{sql}}) a where the_geom is not null AND {{column}} is not null ";
      // } else if (normalization == null) {
      //   var wrap_sql = "SELECT {{column}} as _target_column FROM ({{sql}}) a where {{column}} is not null ";
      // } else {
      //   var wrap_sql = "SELECT {{column}}/{{normalization}} as _target_column FROM ({{sql}}) a where {{normalization}} is not null AND {{column}} is not null ";

      // }

      // wrap_sql = Mustache.render(wrap_sql.join('\n'), {
      //   normalization: normalization, 
      //   column: column, 
      //   sql: sql
      // });

      // var newS = [
      //   'with stats as (',
      //       'select min(_target_column) as min,',
      //              'max(_target_column) as max,',
      //              'avg(_target_column) as avg,',
      //              'stddev(_target_column) as stddev,',
      //              'stddev(_target_column) / avg(_target_column) as stdevmean, ',
      //              'CDB_DistType(array_agg(_target_column::numeric)) as dist_type ',
      //         'from ({{sql}}) _wrap ',
      //   '),',
      //    'buckets as (',
      //       'select CDB_QuantileBins(array_agg(_target_column::numeric), 7) as quantiles, ',
      //       '       CDB_EqualIntervalBins(array_agg(_target_column::numeric), 7) as equalint, ',
      //       '       CDB_JenksBins(array_agg(_target_column::numeric), 7) as jenks, ',
      //       '       CDB_HeadsTailsBins(array_agg(_target_column::numeric), 7) as headtails ',
      //       'from ({{sql}}) _table_sql',
      //    ')',
      //    'select * from histogram, stats, buckets'
      // ];

      var query = Mustache.render(s.join('\n'), {
        column: column, 
        sql: sql
      });
      this.execute(query, function(data) {
        var row = data.rows[0];
        var s = array_agg(row.hist);
        callback({
          type: 'number',
          hist: _(s).map(function(row) {
            var r = row.match(/\((.*),".(\d+),(\d+).",(\d+)/);
            var range = null;
            if (r) {
              //range = [+r[2], +r[3]]
            }
            return null;//{ index: r[1], range: range, freq: +r[4] }
          }),
          stddev: row.stddev,
          avg: row.avg,
          max: row.max,
          min: row.min,
          weight: 1-row.stddevmean,
          quantiles: row.quantiles,
          equalint: row.equalint,
          jenks: row.jenks,
          headtails: row.headtails,
          dist_type: row.dist_type
        });
      });
  }

  // describe a column
  SQL.prototype.describe = function(sql, column, options) {
      var self = this;
      var args = arguments,
          fn = args[args.length -1];
      if(_.isFunction(fn)) {
        var _callback = fn;
      }
      var callback = function(data) {
        data.column = column;
        _callback(data);
      }
      var s = "select * from (" + sql + ") __wrap limit 0";
      this.execute(s, function(data) {
        var type = data.fields[column].type;
        if (!type) {
          callback(new Error("column does not exist"));
          return;
        }
        if (type === 'string') {
          self.describeString(sql, column, options, callback);
        } else if (type === 'number') {
          self.describeFloat(sql, column, options, callback);
        } else if (type === 'geometry') {
          self.describeGeom(sql, column, options, callback);
        } else {
          callback(new Error("column type does not supported"));
        }
      });
  }

  root.cartodb.SQL = SQL;

})();
