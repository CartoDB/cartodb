(function() {

  var root = this;

  function SQL() {
    this.executeCount = 0;
    this.getBoundsCount = 0;
    this.executeResponse = null;
    this.getBoundsResponse = null;
  }


  SQL.prototype.execute= function(sql, vars, options, callback) {
    this.executeCount++;
    return executeResponse;
  }

  SQL.prototype.getBounds = function(sql, vars, options, callback) {
    this.getBoundsCount++;
    this.getBoundsResponse;
  }

  cartodb.SQLMock = SQL;

})();
