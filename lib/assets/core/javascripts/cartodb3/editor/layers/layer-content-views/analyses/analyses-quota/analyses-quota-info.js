var _ = require('underscore');
var Backbone = require('backbone');
var cdb = require('cartodb.js');

var SERVICE_QUOTA_QUERY = 'select * from cdb_dataservices_client.cdb_service_quota_info();';

module.exports = Backbone.Collection.extend({
  initialize: function (models, options) {
    if (!options || !options.configModel) throw new Error('configModel is required');

    var configModel = options.configModel;
    this.SQL = new cdb.SQL({
      user: configModel.get('user_name'),
      sql_api_template: configModel.get('sql_api_template'),
      api_key: configModel.get('api_key')
    });

    this._state = 'unfetched';
  },

  fetch: function (options) {
    this._success = options.success;
    this._error = options.error;

    if (!this.isFetching()) {
      this._state = 'fetching';
      this.SQL.execute(SERVICE_QUOTA_QUERY, null, {
        success: function (data) {
          this._state = 'fetched';
          this._onFetchSuccess(data);
          this._success && this._success();
        }.bind(this),
        error: function (err) {
          this._state = 'errored';
          var error = JSON.parse(err.responseText);
          this._error && this._error(error.error[0]);
        }.bind(this)
      });
    }
  },

  _onFetchSuccess: function (data) {
    var models = data.rows;
    _.each(models, function (model) {
      var m = this.findWhere({service: model.service});
      m ? m.set(model) : this.add(model);
    }, this);
  },

  getService: function (service) {
    return this.findWhere({service: service});
  },

  isFetching: function () {
    var state = this._state;
    return state === 'fetching';
  },

  getSate: function () {
    return this._state;
  }
});
