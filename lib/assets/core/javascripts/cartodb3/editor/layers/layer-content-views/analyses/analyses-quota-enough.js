var _ = require('underscore');
var $ = require('jquery');
var cdb = require('cartodb.js');

var ENOUGH_QUOTA_QUERY = _.template("select cdb_dataservices_client.cdb_enough_quota('<%= analysis %>', <%= rows %>);");

module.exports = function (configModel, service, rows) {
  var SQL = new cdb.SQL({
    user: configModel.get('user_name'),
    sql_api_template: configModel.get('sql_api_template'),
    api_key: configModel.get('api_key')
  });

  var query = ENOUGH_QUOTA_QUERY({
    analysis: service,
    rows: rows
  });

  var deferred = $.Deferred();

  var errorCallback = function (err) {
    var error = JSON.parse(err.responseText);
    deferred.reject(error);
  };

  var successCallback = function (data) {
    deferred.resolve(data);
  };

  SQL.execute(query, null, {
    success: successCallback,
    error: errorCallback
  });

  return deferred.promise();
};
