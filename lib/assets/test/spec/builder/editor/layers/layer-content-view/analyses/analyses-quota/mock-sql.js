module.exports = {
  mock: function (obj, type, response) {
    obj.SQL.execute = function (query, vars, params) {
      var callback = params && params[type] || params.success;
      callback(response);
    };
  }
};
