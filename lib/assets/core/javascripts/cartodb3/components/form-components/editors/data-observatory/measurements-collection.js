var Backbone = require('backbone');
var cdb = require('cartodb.js');
var errorParse = require('../../../../../helpers/error-parser');
var checkAndBuildOpts = require('../../../helpers/required-opts');

var MEASUREMENTS_QUERY = 'SELECT * FROM OBS_GetAvailableNumerators(ST_SetSRID((SELECT ST_Extent(the_geom) FROM <%- dataset %>), 4326), <%- country %>) numers';

var REQUIRED_OPTS = [
  'configModel',
  'layerDefinitionModel'
];

module.exports = Backbone.Collection.extend({
  initialize: function (models, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    this._country = options.country || null;

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

    var query = MEASUREMENTS_QUERY({
      dataset: this._layerDefinitionModel.getTableName(),
      country: this._country
    });

    if (!this.isFetching()) {
      this._state = 'fetching';
      this.SQL.execute(query, null, {
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
