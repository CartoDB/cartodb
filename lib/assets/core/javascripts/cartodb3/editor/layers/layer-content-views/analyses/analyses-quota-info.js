var _ = require('underscore');
var Backbone = require('backbone');
var cdb = require('cartodb.js');

var SERVICE_QUOTA_QUERY = 'select * from cdb_dataservices_client.cdb_service_quota_info();';

module.exports = Backbone.Collection.extend({
  initialize: function (models, options) {
    if (!options || !options.configModel) throw new Error('configModel is required');

    this._configModel = options.configModel;
    this._SQL = new cdb.SQL({
      user: this._configModel.get('user_name'),
      sql_api_template: this._configModel.get('sql_api_template'),
      api_key: this._configModel.get('api_key')
    });

    this._state = 'unfetched';
  },

  fetch: function (options) {
    console.log('fetch');
    if (!this.isFetching()) {
      console.log('fetching');
      this._state = 'fetching';
      this._SQL.execute(SERVICE_QUOTA_QUERY, null, {
        success: function (data) {
          this._state = 'fetched';
          this._onFetchSuccess(data);
          options && options.success();
        }.bind(this),
        error: function (err) {
          this._state = 'errored';
          var error = JSON.parse(err.responseText);
          options && options.error(error);
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

    console.log('fetched');
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
