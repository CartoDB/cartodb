(function() {

  var root = this;

  function SQL(options) {
    if(cdb === this || window === this) {
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

    if(options.api_key) {
      this.api_key = options.api_key;
    }

    this.options = _.defaults(options, {
      version: 'v2',
      protocol: loc,
      jsonp: !$.support.cors
    })
  }

  SQL.prototype._host = function() {
    var opts = this.options;
    if(opts && opts.completeDomain) {
      return opts.completeDomain + '/api/' +  opts.version + '/sql'
    } else {
      var host = opts.host || 'cartodb.com';
      var protocol = opts.protocol || 'https';

      return protocol + '://' + opts.user + '.' + host + '/api/' +  opts.version + '/sql';
    }
  }

  /**
   * var sql = new SQL('cartodb_username');
   * sql.execute("select * form {table} where id = {id}", {
   *    table: 'test',
   *    id: '1'
   * })
   */
  SQL.prototype.execute= function(sql, vars, options, callback) {
    var promise = new cdb._Promise();
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

    if(options.jsonp) {
      delete params.crossDomain;
      params.dataType = 'jsonp';
    }

    // create query
    var query = Mustache.render(sql, vars);
    var q = 'q=' + encodeURIComponent(query);

    // request params
    var reqParams = ['format', 'dp'];
    for(var i in reqParams) {
      var r = reqParams[i];
      var v = options[r];
      if(v) {
        q += '&' + r + "=" + v;
      }
    }


    var isGetRequest = options.type == 'get' || params.type == 'get';
    // generate url depending on the http method
    params.url = this._host() ;
    if(isGetRequest) {
      params.url += '?' + q
    } else {
      params.data = q;
    }
    if(this.api_key) {
      if(isGetRequest) {
        params.url += '&api_key=' + this.api_key;
      } else {
        darams.data['api_key'] = this.api_key;
      }
    }

    // wrap success and error functions
    var success = options.success;
    var error = options.error;
    if(success) delete options.success;
    if(error) delete error.success;

    params.error = function(resp) {
      var errors = resp.responseText && JSON.parse(resp.responseText);
      promise.trigger('error', errors && errors.error, resp)
      if(error) error(resp);
    }
    params.success = function(resp, status, xhr) {
      promise.trigger('done', resp, status, xhr);
      if(success) success(resp, status, xhr);
      if(callback) callback(resp);
    }

    // call ajax
    delete options.jsonp;
    $.ajax(_.extend(params, options));
    return promise;
  }

  SQL.prototype.getBounds = function(sql, vars, options, callback) {
      var promise = new cdb._Promise();
      var args = arguments,
      fn = args[args.length -1];
      if(_.isFunction(fn)) {
        callback = fn;
      }
      var s = 'SELECT ST_XMin(ST_Extent(the_geom)) as minx,' +
              '       ST_YMin(ST_Extent(the_geom)) as miny,'+
              '       ST_XMax(ST_Extent(the_geom)) as maxx,' +
              '       ST_YMax(ST_Extent(the_geom)) as maxy' +
              ' from ({{sql}}) as subq';
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

    function _table(callback) {
      _table.fetch(callback);
    }

    _table.fetch = function(callback) {
      _sql.execute(_table.sql(), {}, callback);
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

  cartodb.SQL = SQL;

})();
