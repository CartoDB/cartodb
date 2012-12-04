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


  SQL.prototype.execute= function(sql, vars, options, callback) {
    var self = this;
    SQL.prototype.executeCount++;
    this.executeCount++;
    SQL.prototype.executeArgs = {sql: sql, vars: vars, options: options, callback: callback};
    if(callback) {
      callback(this.executeResponse);
    }
    return {
      "done": function(f) {
        f(self.executeResponse);
      },
      "fail": function(f) {
        f(self.executeResponse);
      }
    }
  }

  SQL.prototype.getBounds = function(sql, vars, options, callback) {
    this.getBoundsCount++;
    this.getBoundsResponse;
  }

  cartodb.SQLMock = SQL;

})();
