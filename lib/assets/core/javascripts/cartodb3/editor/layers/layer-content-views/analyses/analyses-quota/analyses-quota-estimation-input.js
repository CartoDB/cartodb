var _ = require('underscore');
var $ = require('jquery');
var cdb = require('cartodb.js');

var ESTIMATION_QUOTA_QUERY = _.template('EXPLAIN <%= query %>;');

module.exports = {
  init: function (configModel) {
    this.SQL = new cdb.SQL({
      user: configModel.get('user_name'),
      sql_api_template: configModel.get('sql_api_template'),
      api_key: configModel.get('api_key')
    });
  },

  fetch: function (query) {
    var estimationQuery = ESTIMATION_QUOTA_QUERY({
      query: query
    });

    if (!this.deferred || this.deferred.state() !== 'pending') {
      var deferred = $.Deferred();
      this.deferred = deferred;

      // The response is like {"rows":[{"QUERY PLAN":"Seq Scan on paradas_metro_madrid  (cost=0.00..6.97 rows=325 width=108)"}],"time":0.001,"fields":{"QUERY PLAN":{"type":"string"}},"total_rows":1}
      var parseResponse = function (response) {
        var regex = /rows=(.+)\s/;
        var match = response.rows[0]['QUERY PLAN'].match(regex);
        return match[1];
      };

      var errorCallback = function (err) {
        var error = JSON.parse(err.responseText);
        deferred.rejectWith(null, error);
      };

      var successCallback = function (data) {
        deferred.resolve(parseResponse(data));
      };

      this.SQL.execute(estimationQuery, null, {
        success: successCallback,
        error: errorCallback
      });
    }

    return this.deferred.promise();
  }
};
