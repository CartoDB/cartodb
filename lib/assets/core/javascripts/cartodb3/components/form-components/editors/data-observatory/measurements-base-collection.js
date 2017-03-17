var Backbone = require('backbone');
var cdb = require('cartodb.js');
var errorParse = require('../../../../helpers/error-parser');
var checkAndBuildOpts = require('../../../../helpers/required-opts');

var REQUIRED_OPTS = [
  'configModel',
  'layerDefinitionModel'
];

module.exports = Backbone.Collection.extend({
  initialize: function (models, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    this._country = options.country || 'NULL';
    this._querySchemaModel = this._layerDefinitionModel.getAnalysisDefinitionNodeModel().querySchemaModel;

    var configModel = options.configModel;
    this.SQL = new cdb.SQL({
      user: configModel.get('user_name'),
      sql_api_template: configModel.get('sql_api_template'),
      api_key: configModel.get('api_key')
    });

    this._state = 'unfetched';
  },

  fetch: function (options) {
    this._success = options && options.success;
    this._error = options && options.error;
    var table = this._layerDefinitionModel.getTableName();
    var query = this._querySchemaModel.get('query');

    var sqlQuery = this._queryTemplate({
      table: table,
      query: query,
      country: this._country
    });

    if (!this.isFetching()) {
      this._state = 'fetching';
      this.SQL.execute(sqlQuery, null, {
        success: function (data) {
          this._state = 'fetched';
          this._onFetchSuccess(data);
          this._success && this._success();
        }.bind(this),
        error: function (err) {
          this._state = 'error';
          this._error && this._error(errorParse(err));
        }.bind(this)
      });
    }
  },

  _onFetchSuccess: function (data) {
    var models = data.rows;
    this.reset(models);
  },

  isFetching: function () {
    return this.getState() === 'fetching';
  },

  getState: function () {
    return this._state;
  }
});
