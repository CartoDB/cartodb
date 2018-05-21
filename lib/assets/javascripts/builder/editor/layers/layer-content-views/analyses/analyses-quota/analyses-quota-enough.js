var _ = require('underscore');
var $ = require('jquery');
var cdb = require('internal-carto.js');
var errorParse = require('builder/helpers/error-parser');

var ENOUGH_QUOTA_QUERY = _.template("select cdb_dataservices_client.cdb_enough_quota('<%= analysis %>', <%= rows %>);");

module.exports = {
  init: function (configModel) {
    this.SQL = new cdb.SQL({
      user: configModel.get('user_name'),
      sql_api_template: configModel.get('sql_api_template'),
      api_key: configModel.get('api_key')
    });
  },

  fetch: function (service, rows) {
    var query = ENOUGH_QUOTA_QUERY({
      analysis: service,
      rows: rows
    });

    if (!this.deferred || this.deferred.state() !== 'pending') {
      var deferred = $.Deferred();
      this.deferred = deferred;

      var errorCallback = function (err) {
        deferred.reject(errorParse(err));
      };

      var successCallback = function (data) {
        // response is something like:
        // {"rows":[{"cdb_enough_quota":false}],"time":0.024,"fields":{"cdb_enough_quota":{"type":"boolean"}},"total_rows":1}
        deferred.resolve(data.rows[0].cdb_enough_quota);
      };

      this.SQL.execute(query, null, {
        success: successCallback,
        error: errorCallback
      });
    }

    return this.deferred.promise();
  }
};
