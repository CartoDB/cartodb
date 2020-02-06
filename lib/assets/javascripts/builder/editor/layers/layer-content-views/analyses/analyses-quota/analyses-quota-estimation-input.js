var _ = require('underscore');
require('jquery-migrate');
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
    var query = ESTIMATION_QUOTA_QUERY({
      query: query
    });

    return new Promise(function (resolve, reject) {
      var errorCallback = function (err) {
        reject(errorParse(err));
      };

      var successCallback = function (data) {
        resolve(parseResponse(data));
      };

      this.SQL.execute(query, null, {
        success: successCallback,
        error: errorCallback
      });
    }.bind(this));
  }
};
