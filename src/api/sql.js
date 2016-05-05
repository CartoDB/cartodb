var _ = require('underscore');
var $ = require('jquery');
var Mustache = require('mustache');
var Promise = require('./promise');

function SQL (options) {
  if (window.cdb === this || window === this) {
    return new SQL(options);
  }
  if (!options.user) {
    throw new Error('user should be provided');
  }
  var loc = new String(window.location.protocol);
  loc = loc.slice(0, loc.length - 1);
  if (loc == 'file') {
    loc = 'https';
  }

  this.options = _.defaults(options, {
    version: 'v2',
    protocol: loc,
    jsonp: !$.support.cors
  });

  if (!this.options.sql_api_template) {
    var opts = this.options;
    var template = null;
    if (opts && opts.completeDomain) {
      template = opts.completeDomain;
    } else {
      var host = opts.host || 'cartodb.com';
      var protocol = opts.protocol || 'https';
      template = protocol + '://{user}.' + host;
    }
    this.options.sql_api_template = template;
  }
}

SQL.prototype._host = function () {
  var opts = this.options;
  return opts.sql_api_template.replace('{user}', opts.user) + '/api/' + opts.version + '/sql';
},

/**
 * var sql = new SQL('cartodb_username');
 * sql.execute("select * from {{ table }} where id = {{ id }}", {
 *    table: 'test',
 *    id: '1'
 * })
 */
SQL.prototype.execute = function (sql, vars, options, callback) {
  // Variable that defines if a query should be using get method or post method
  var MAX_LENGTH_GET_QUERY = 1024;

  var promise = new Promise();
  if (!sql) {
    throw new TypeError('sql should not be null');
  }
  // setup arguments
  var args = arguments,
    fn = args[args.length - 1];
  if (_.isFunction(fn)) {
    callback = fn;
  }
  options = _.defaults(options || {}, this.options);
  var params = {
    type: 'get',
    dataType: 'json',
    crossDomain: true
  };

  if (options.cache !== undefined) {
    params.cache = options.cache;
  }

  if (options.jsonp) {
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

  params.url = this._host();
  if (isGetRequest) {
    var q = 'q=' + encodeURIComponent(query);
    for (var i in reqParams) {
      var r = reqParams[i];
      var v = options[r];
      if (v) {
        q += '&' + r + '=' + v;
      }
    }

    params.url += '?' + q;
  } else {
    var objPost = {'q': query};
    for (var i in reqParams) {
      var r = reqParams[i];
      var v = options[r];
      if (v) {
        objPost[r] = v;
      }
    }

    params.data = objPost;
    params.type = 'post';
  }

  // wrap success and error functions
  var success = options.success;
  var error = options.error;
  if (success) delete options.success;
  if (error) delete error.success;

  params.error = function (resp) {
    var res = resp.responseText || resp.response;
    var errors = res && JSON.parse(res);
    promise.trigger('error', errors && errors.error, resp);
    if (error) error(resp);
    if (callback) callback(resp);
  };
  params.success = function (resp, status, xhr) {
    // manage rewest
    if (status == undefined) {
      status = resp.status;
      xhr = resp;
      resp = JSON.parse(resp.response);
    }
    // Timeout explanation. CartoDB.js ticket #336
    // From St.Ov.: "what setTimeout does is add a new event to the browser event queue
    // and the rendering engine is already in that queue (not entirely true, but close enough)
    // so it gets executed before the setTimeout event."
    setTimeout(function () {
      promise.trigger('done', resp, status, xhr);
      if (success) success(resp, status, xhr);
      if (callback) callback(null, resp);
    }, 0);
  };

  // call ajax
  delete options.jsonp;
  $.ajax(_.extend(params, options));
  return promise;
};

SQL.prototype.getBounds = function (sql, vars, options, callback) {
  var promise = new Promise();
  var args = arguments,
    fn = args[args.length - 1];
  if (_.isFunction(fn)) {
    callback = fn;
  }
  var s = 'SELECT ST_XMin(ST_Extent(the_geom)) as minx,' +
    '       ST_YMin(ST_Extent(the_geom)) as miny,' +
    '       ST_XMax(ST_Extent(the_geom)) as maxx,' +
    '       ST_YMax(ST_Extent(the_geom)) as maxy' +
    ' from ({{{ sql }}}) as subq';
  sql = Mustache.render(sql, vars);
  this.execute(s, { sql: sql }, options)
    .done(function (result) {
      if (result.rows && result.rows.length > 0 && result.rows[0].maxx != null) {
        var c = result.rows[0];
        var minlat = -85.0511;
        var maxlat = 85.0511;
        var minlon = -179;
        var maxlon = 179;

        var clamp = function (x, min, max) {
          return x < min ? min : x > max ? max : x;
        };

        var lon0 = clamp(c.maxx, minlon, maxlon);
        var lon1 = clamp(c.minx, minlon, maxlon);
        var lat0 = clamp(c.maxy, minlat, maxlat);
        var lat1 = clamp(c.miny, minlat, maxlat);

        var bounds = [[lat0, lon0], [lat1, lon1]];
        promise.trigger('done', bounds);
        callback && callback(null, bounds);
      }
    })
    .error(function (err) {
      promise.trigger('error', err);
      callback && callback(err);
    });

  return promise;
};

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

SQL.prototype.table = function (name) {
  var _name = name;
  var _filters;
  var _columns = [];
  var _limit;
  var _order;
  var _orderDir;
  var _sql = this;

  function _table () {
    _table.fetch.apply(_table, arguments);
  }

  _table.fetch = function (vars) {
    vars = vars || {};
    var args = arguments,
      fn = args[args.length - 1];
    if (_.isFunction(fn)) {
      callback = fn;
      if (args.length === 1) vars = {};
    }
    _sql.execute(_table.sql(), vars, callback);
  };

  _table.sql = function () {
    var s = 'select';
    if (_columns.length) {
      s += ' ' + _columns.join(',') + ' ';
    } else {
      s += ' * ';
    }

    s += 'from ' + _name;

    if (_filters) {
      s += ' where ' + _filters;
    }
    if (_limit) {
      s += ' limit ' + _limit;
    }
    if (_order) {
      s += ' order by ' + _order;
    }
    if (_orderDir) {
      s += ' ' + _orderDir;
    }

    return s;
  };

  _table.filter = function (f) {
    _filters = f;
    return _table;
  };

  _table.order_by = function (o) {
    _order = o;
    return _table;
  };
  _table.asc = function () {
    _orderDir = 'asc';
    return _table;
  };

  _table.desc = function () {
    _orderDir = 'desc';
    return _table;
  };

  _table.columns = function (c) {
    _columns = c;
    return _table;
  };

  _table.limit = function (l) {
    _limit = l;
    return _table;
  };

  return _table;

};

/*
 * sql.filter(sql.f().distance('< 10km')
 */
/*SQL.geoFilter = function() {
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
function array_agg (s) {
  return JSON.parse(s.replace(/^{/, '[').replace(/}$/, ']'));
}

SQL.prototype.describeString = function (sql, column, callback) {
  var s = [
    'WITH t as (',
    '        SELECT count(*) as total,',
    '               count(DISTINCT {{column}}) as ndist',
    '        FROM ({{sql}}) _wrap',
    '      ), a as (',
    '        SELECT ',
    '          count(*) cnt, ',
    '          {{column}}',
    '        FROM ',
    '          ({{sql}}) _wrap ',
    '        GROUP BY ',
    '          {{column}} ',
    '        ORDER BY ',
    '          cnt DESC',
    '        ), b As (',
    '         SELECT',
    '          row_number() OVER (ORDER BY cnt DESC) rn,',
    '          cnt',
    '         FROM a',
    '        ), c As (',
    '        SELECT ',
    '          sum(cnt) OVER (ORDER BY rn ASC) / t.total cumperc,',
    '          rn,',
    '          cnt ',
    '         FROM b, t',
    '         LIMIT 10',
    '         ),',
    'stats as (',
    'select count(distinct({{column}})) as uniq, ',
    '       count(*) as cnt, ',
    "       sum(case when COALESCE(NULLIF({{column}},'')) is null then 1 else 0 end)::numeric as null_count, ",
    "       sum(case when COALESCE(NULLIF({{column}},'')) is null then 1 else 0 end)::numeric / count(*)::numeric as null_ratio, ",
    // '       CDB_DistinctMeasure(array_agg({{column}}::text)) as cat_weight ',
    '       (SELECT max(cumperc) weight FROM c) As skew ',
    'from ({{sql}}) __wrap',
    '),',
    'hist as (',
    'select array_agg(row(d, c)) array_agg from (select distinct({{column}}) d, count(*) as c from ({{sql}}) __wrap, stats group by 1 limit 100) _a',
    ')',
    'select * from stats, hist'
  ];

  var query = Mustache.render(s.join('\n'), {
    column: column,
    sql: sql
  });

  var normalizeName = function (str) {
    var normalizedStr = str.replace(/^"(.+(?="$))?"$/, '$1'); // removes surrounding quotes
    return normalizedStr.replace(/""/g, '"'); // removes duplicated quotes
  };

  this.execute(query, function (err, data) {
    if (err) {
      callback(err);
      return;
    }

    var row = data.rows[0];
    var weight = 0;
    var histogram = [];

    try {
      var s = array_agg(row.array_agg);

      var histogram = _(s).map(function (row) {
        var r = row.match(/\((.*),(\d+)/);
        var name = normalizeName(r[1]);
        return [name, +r[2]];
      });

      weight = row.skew * (1 - row.null_ratio) * (1 - row.uniq / row.cnt) * (row.uniq > 1 ? 1 : 0);
    } catch(e) {}

    callback(null, {
      type: 'string',
      hist: histogram,
      distinct: row.uniq,
      count: row.cnt,
      null_count: row.null_count,
      null_ratio: row.null_ratio,
      skew: row.skew,
      weight: weight
    });
  });
};

SQL.prototype.describeDate = function (sql, column, callback) {
  var s = [
    'with minimum as (',
    'SELECT min({{column}}) as start_time FROM ({{sql}}) _wrap), ',
    'maximum as (SELECT max({{column}}) as end_time FROM ({{sql}}) _wrap), ',
    'null_ratio as (SELECT sum(case when {{column}} is null then 1 else 0 end)::numeric / count(*)::numeric as null_ratio FROM ({{sql}}) _wrap), ',
    'moments as (SELECT count(DISTINCT {{column}}) as moments FROM ({{sql}}) _wrap)',
    'SELECT * FROM minimum, maximum, moments, null_ratio'
  ];
  var query = Mustache.render(s.join('\n'), {
    column: column,
    sql: sql
  });

  this.execute(query, function (err, data) {
    if (err) {
      callback(err);
      return;
    }

    var row = data.rows[0];
    var e = new Date(row.end_time);
    var s = new Date(row.start_time);

    var moments = row.moments;

    var steps = Math.min(row.moments, 1024);

    callback(null, {
      type: 'date',
      start_time: s,
      end_time: e,
      range: e - s,
      steps: steps,
      null_ratio: row.null_ratio
    });
  });
};

SQL.prototype.describeBoolean = function (sql, column, callback) {
  var s = [
    'with stats as (',
    'select count(distinct({{column}})) as uniq,',
    'count(*) as cnt',
    'from ({{sql}}) _wrap ',
    '),',
    'null_ratio as (',
    'SELECT sum(case when {{column}} is null then 1 else 0 end)::numeric / count(*)::numeric as null_ratio FROM ({{sql}}) _wrap), ',
    'true_ratio as (',
    'SELECT sum(case when {{column}} is true then 1 else 0 end)::numeric / count(*)::numeric as true_ratio FROM ({{sql}}) _wrap) ',
    'SELECT * FROM true_ratio, null_ratio, stats'
  ];
  var query = Mustache.render(s.join('\n'), {
    column: column,
    sql: sql
  });

  this.execute(query, function (err, data) {
    if (err) {
      callback(err);
      return;
    }

    var row = data.rows[0];

    callback(null, {
      type: 'boolean',
      null_ratio: row.null_ratio,
      true_ratio: row.true_ratio,
      distinct: row.uniq,
      count: row.cnt
    });
  });
};

SQL.prototype.describeGeom = function (sql, column, callback) {
  var s = [
    'with geotype as (',
    'select st_geometrytype({{column}}) as geometry_type from ({{sql}}) _w where {{column}} is not null limit 1',
    ')',
    'select * from geotype'
  ];

  var query = Mustache.render(s.join('\n'), {
    column: column,
    sql: sql
  });
  function simplifyType (g) {
    return {
      'st_multipolygon': 'polygon',
      'st_polygon': 'polygon',
      'st_multilinestring': 'line',
      'st_linestring': 'line',
      'st_multipoint': 'point',
      'st_point': 'point'
    }[g.toLowerCase()];
  }

  this.execute(query, function (err, data) {
    if (err) {
      callback(err);
      return;
    }

    var row = data.rows[0];
    callback(null, {
      type: 'geom',
      // lon,lat -> lat, lon
      geometry_type: row.geometry_type,
      simplified_geometry_type: simplifyType(row.geometry_type)
    });
  });
};

SQL.prototype.columns = function (sql, options, callback) {
  var args = arguments,
    fn = args[args.length - 1];
  if (_.isFunction(fn)) {
    callback = fn;
  }
  var s = 'select * from (' + sql + ') __wrap limit 0';
  var exclude = ['cartodb_id', 'latitude', 'longitude', 'created_at', 'updated_at', 'lat', 'lon', 'the_geom_webmercator'];
  this.execute(s, function (err, data) {
    if (err) {
      callback(err);
      return;
    }

    var t = {};
    for (var i in data.fields) {
      if (exclude.indexOf(i) === -1) {
        t[i] = data.fields[i].type;
      }
    }
    callback(null, t);
  });
};

SQL.prototype.describeFloat = function (sql, column, callback) {
  var s = [
    'with stats as (',
    'select min({{column}}) as min,',
    'max({{column}}) as max,',
    'avg({{column}}) as avg,',
    'count(DISTINCT {{column}}) as cnt,',
    'count(distinct({{column}})) as uniq,',
    'count(*) as cnt,',
    'sum(case when {{column}} is null then 1 else 0 end)::numeric / count(*)::numeric as null_ratio,',
    'stddev_pop({{column}}) / count({{column}}) as stddev,',
    'CASE WHEN abs(avg({{column}})) > 1e-7 THEN stddev({{column}}) / abs(avg({{column}})) ELSE 1e12 END as stddevmean,',
    'CDB_DistType(array_agg("{{column}}"::numeric)) as dist_type ',
    'from ({{sql}}) _wrap ',
    '),',
    'params as (select min(a) as min, (max(a) - min(a)) / 7 as diff from ( select {{column}} as a from ({{sql}}) _table_sql where {{column}} is not null ) as foo ),',
    'histogram as (',
    'select array_agg(row(bucket, range, freq)) as hist from (',
    'select CASE WHEN uniq > 1 then width_bucket({{column}}, min-0.01*abs(min), max+0.01*abs(max), 100) ELSE 1 END as bucket,',
    'numrange(min({{column}})::numeric, max({{column}})::numeric) as range,',
    'count(*) as freq',
    'from ({{sql}}) _w, stats',
    'group by 1',
    'order by 1',
    ') __wrap',
    '),',
    'hist as (',
    'select array_agg(row(d, c)) cat_hist from (select distinct({{column}}) d, count(*) as c from ({{sql}}) __wrap, stats group by 1 limit 100) _a',
    '),',
    'buckets as (',
    'select CDB_QuantileBins(array_agg(distinct({{column}}::numeric)), 7) as quantiles, ',
    '       (select array_agg(x::numeric) FROM (SELECT (min + n * diff)::numeric as x FROM generate_series(1,7) n, params) p) as equalint,',
    // '       CDB_EqualIntervalBins(array_agg({{column}}::numeric), 7) as equalint, ',
    '       CDB_JenksBins(array_agg(distinct({{column}}::numeric)), 7) as jenks, ',
    '       CDB_HeadsTailsBins(array_agg(distinct({{column}}::numeric)), 7) as headtails ',
    'from ({{sql}}) _table_sql where {{column}} is not null',
    ')',
    'select * from histogram, stats, buckets, hist'
  ];

  var query = Mustache.render(s.join('\n'), {
    column: column,
    sql: sql
  });

  this.execute(query, function (err, data) {
    if (err) {
      callback(err);
      return;
    }

    var row = data.rows[0];
    var s = array_agg(row.hist);
    var h = array_agg(row.cat_hist);
    callback(null, {
      type: 'number',
      cat_hist: _(h).map(function (row) {
        var r = row.match(/\((.*),(\d+)/);
        return [+r[1], +r[2]];
      }),
      hist: _(s).map(function (row) {
        if (row.indexOf('empty') > -1) return;
        var els = row.split('"');
        return { index: els[0].replace(/\D/g, ''),
          range: els[1].split(',').map(function (d) {return d.replace(/\D/g, '');}),
        freq: els[2].replace(/\D/g, '') };
      }),
      stddev: row.stddev,
      null_ratio: row.null_ratio,
      count: row.cnt,
      distinct: row.uniq,
      // lstddev: row.lstddev,
      avg: row.avg,
      max: row.max,
      min: row.min,
      stddevmean: row.stddevmean,
      weight: (row.uniq > 1 ? 1 : 0) * (1 - row.null_ratio) * (row.stddev < -1 ? 1 : (row.stddev < 1 ? 0.5 : (row.stddev < 3 ? 0.25 : 0.1))),
      quantiles: row.quantiles,
      equalint: row.equalint,
      jenks: row.jenks,
      headtails: row.headtails,
      dist_type: row.dist_type
    });
  });
};

// describe a column
SQL.prototype.describe = function (sql, column, options) {
  var self = this;
  var args = arguments,
    fn = args[args.length - 1];
  if (_.isFunction(fn)) {
    var _callback = fn;
  }
  var callback = function (err, data) {
    if (err) {
      _callback(err);
      return;
    }

    data.column = column;
    _callback(null, data);
  };
  var s = 'select * from (' + sql + ') __wrap limit 0';
  this.execute(s, function (err, data) {
    if (err) {
      callback(err);
      return;
    }

    var type = (options && options.type) ? options.type : data.fields[column].type;

    if (!type) {
      callback(new Error('column does not exist'));
      return;
    }

    else if (type === 'string') {
      self.describeString(sql, column, callback);
    } else if (type === 'number') {
      self.describeFloat(sql, column, callback);
    } else if (type === 'geometry') {
      self.describeGeom(sql, column, callback);
    } else if (type === 'date') {
      self.describeDate(sql, column, callback);
    } else if (type === 'boolean') {
      self.describeBoolean(sql, column, callback);
    } else {
      callback(new Error('column type is not supported'));
    }
  });
};

module.exports = SQL;
