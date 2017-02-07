module.exports = {
  mock: function (obj, type, response, done) {
    obj.SQL.execute = function (query, vars, params) {
      var callback = params && params[type] || params.success;
      callback(response);
    };
  }
};
