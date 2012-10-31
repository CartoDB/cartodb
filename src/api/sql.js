(function() {

  var root = this;

  function SQL(options) {
    if(!options.user) {
      throw new Error("user should be provided");
    }
    var loc = new String(window.location.protocol);
    loc = loc.slice(0, loc.length - 1);
    if(loc == 'file') {
      loc = 'https';
    }
    this.options = _.defaults(options, {
      version: 'v2',
      protocol: loc
    })
  }

  SQL.prototype._host = function() {
    var opts = this.options;
    var host = opts.host || 'cartodb.com';
    var protocol = opts.protocol || 'https';
    return protocol + '://' + opts.user + '.' + host + '/api/' +  opts.version + '/sql';
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
    options = options || {};
    var params = {
      type: 'get',
      dataType: 'json',
      crossDomain: true
    };

    // create query
    var query = Mustache.render(sql, vars);
    var q = 'q=' + encodeURIComponent(query);

    // request params 
    var reqParams = ['format', 'dp'];
    for(var i in reqParams) {
      var r = reqParams[i];
      var v = this.options[r] || options[r];
      if(v) {
        q += '&' + r + "=" + v;
      }
    }

    // generate url depending on the http method
    params.url = this._host() ;
    if(options.type == 'get' || params.type == 'get') {
      params.url += '?' + q
    } else {
      params.data = q;
    }

    // wrap success and error functions
    var success = options.success;
    var error = options.error;
    if(success) delete options.success;
    if(error) delete error.success;
    params.error = function(resp) {
      promise.trigger('error', resp)
      if(error) error(resp);
    }
    params.success = function(resp, status, xhr) {
      promise.trigger('done', resp, status, xhr);
      if(success) success(resp, status, xhr);
      if(callback) callback(resp);
    }

    // call ajax 
    $.ajax(_.extend(params, options));
    return promise;
  }

  cartodb.SQL = SQL;

})();
