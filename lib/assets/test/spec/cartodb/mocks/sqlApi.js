(function() {

  var root = this;

  function SQL() {
    this.executeCount = 0;
    this.getBoundsCount = 0;
  }

  SQL.prototype.executeCount = 0;
  SQL.prototype.getBoundsCount = 0;
  SQL.prototype.executeResponse = null;
  SQL.prototype.getBoundsResponse = null;
  SQL.prototype.promise = {};

  SQL.setResponse = function(method, response) {
    SQL.prototype[method+'Response'] = response;
  }

  SQL.getState = function() {
    return {
      executeCount: SQL.prototype.executeCount,
      getBoundsCount: SQL.prototype.getBoundsCount,
      executeArgs: SQL.prototype.executeArgs
    }
  }

  SQL.prototype.execute = function(sql, vars, options, callback) {
    var self = this;
    SQL.prototype.executeCount++;
    this.executeCount++;
    SQL.prototype.executeArgs = {sql: sql, vars: vars, options: options, callback: callback};
    if(callback) {
      callback(this.executeResponse);
    }
    var d = {
      "done": function(f) {
        SQL.prototype.promise.done = f;
        return d;
      },
      "error": function(f) {
        SQL.prototype.promise.error = f
        return d;
      }
    };
    return d;
  }

  SQL.getPromise = function() { return SQL.prototype.promise; }
  SQL.prototype.getBounds = function(sql, vars, options, callback) {
    this.getBoundsCount++;
    this.getBoundsResponse;
  }

  cartodb.SQLMock = SQL;

})();
