var _ = require('underscore');
var $ = require('jquery');
var cdb = require('internal-carto.js');
var errorParse = require('builder/helpers/error-parser');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'configModel',
  'nodeDefModel'
];

var OBS_META_QUERY = 'SELECT OBS_GetMeta((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM ({{{ query }}}) q), {{{ metadata }}})';

var ColumnName = function (options) {
  checkAndBuildOpts(options, REQUIRED_OPTS, this);
  this._querySchemaModel = this._nodeDefModel.querySchemaModel;
  this.isFetching = false;

  var configModel = options.configModel;
  this.SQL = new cdb.SQL({
    user: configModel.get('user_name'),
    sql_api_template: configModel.get('sql_api_template'),
    api_key: configModel.get('api_key')
  });
};

ColumnName.prototype = {
  buildQuery: function () {
    return OBS_META_QUERY;
  },

  buildQueryOptions: function (options) {
    return {
      metadata: "'[" + JSON.stringify(options) + "]'",
      query: this._querySchemaModel.get('query')
    };
  },

  fetch: function (options) {
    if (!options.numer_id) {
      return;
    }

    this._success = options && options.success;
    this._error = options && options.error;

    var deferred = $.Deferred();

    var queryOptions = this.buildQueryOptions(_.omit(options, 'sucess', 'error'));
    var sqlQuery = this.buildQuery();

    if (!this.isFetching) {
      this.isFetching = true;
      this.SQL.execute(sqlQuery, queryOptions, {
        success: function (data) {
          this.isFetching = false;
          this._success && this._success(data);
          deferred.resolve();
        }.bind(this),
        error: function (err) {
          this.isFetching = false;
          this._error && this._error(errorParse(err));
          deferred.reject();
        }.bind(this)
      });
    } else {
      deferred.reject();
    }

    return deferred.promise();
  }
};

module.exports = ColumnName;
