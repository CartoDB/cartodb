(function() {

  var root = this;

  function SQL() {
    this.executeCount = 0;
    this.getBoundsCount = 0;
  }


  SQL.prototype.executeResponse = null;
  SQL.prototype.getBoundsResponse = null;

  SQL.setResponse = function(method, response) {
    SQL.prototype[method+'Response'] = response;
  }


  SQL.prototype.execute= function(sql, vars, options, callback) {
    var self = this;
    this.executeCount++;
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
