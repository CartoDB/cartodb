var _ = require('underscore');
var cdb = require('cartodb.js');
var errorParse = require('../../helpers/error-parser');
var checkAndBuildOpts = require('../../helpers/required-opts');

var REQUIRED_OPTS = [
  'configModel',
  'nodeDefModel'
];

var OBS_META_QUERY = 'SELECT OBS_GetMeta((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM (<%- query %>) q), {{{ metadata }}})';

module.exports = {
  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    this._querySchemaModel = this._nodeDefModel.querySchemaModel;
    this.isFetching = false;

    var configModel = options.configModel;
    this.SQL = new cdb.SQL({
      user: configModel.get('user_name'),
      sql_api_template: configModel.get('sql_api_template'),
      api_key: configModel.get('api_key')
    });
  },

  buildQuery: function () {
    return _.template(OBS_META_QUERY);
  },

  buildQueryOptions: function (options) {
    return {
      metadata: "'[" + JSON.stringify(options) + "]'"
    };
  },

  fetch: function (options) {
    if (!options.numer_id) {
      return;
    }

    this._success = options && options.success;
    this._error = options && options.error;

    var query = this._querySchemaModel.get('query');
    var queryOptions = this.buildQueryOptions(_.omit(options, 'sucess', 'error'));
    var sqlTemplate = this.buildQuery();
    var sqlQuery = sqlTemplate({
      query: query
    });

    if (!this.isFetching) {
      this.isFetching = true;
      this.SQL.execute(sqlQuery, queryOptions, {
        success: function (data) {
          this.isFetching = false;
          this._success && this._success(data);
        }.bind(this),
        error: function (err) {
          this.isFetching = false;
          this._error && this._error(errorParse(err));
        }.bind(this)
      });
    }
  }
};
