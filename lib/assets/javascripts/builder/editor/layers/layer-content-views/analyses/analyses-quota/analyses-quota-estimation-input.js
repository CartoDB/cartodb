var _ = require('underscore');
var $ = require('jquery');
var cdb = require('internal-carto.js');
var errorParse = require('builder/helpers/error-parser');

var ESTIMATION_QUOTA_QUERY = _.template('SELECT CDB_EstimateRowCount($$<%= query %>;$$)  AS row_count;');

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

      var parseResponse = function (response) {
        return response.rows[0].row_count;
      };

      var errorCallback = function (err) {
        deferred.reject(errorParse(err));
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
