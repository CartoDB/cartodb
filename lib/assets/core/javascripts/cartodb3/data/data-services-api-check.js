var cdb = require('cartodb.js');
var SERVICE_QUOTA_QUERY = 'select * from cdb_dataservices_client.cdb_service_quota_info();';

var DataServiceHealth = function (configModel) {
  if (!configModel) throw new Error('configModel is required');

  this.SQL = new cdb.SQL({
    user: configModel.get('user_name'),
    sql_api_template: configModel.get('sql_api_template'),
    api_key: configModel.get('api_key')
  });

  this.state = 'unknown';
};

DataServiceHealth.prototype = {
  check: function (callback) {
    this.callback = callback;

    if (this.state === 'unknown') {
      this.state = 'checking';
      this.SQL.execute(SERVICE_QUOTA_QUERY, null, {
        success: function () {
          this.state = 'ready';
          this.callback && this.callback(this.state);
        }.bind(this),
        error: function () {
          this.state = 'error';
          this.callback && this.callback(this.state);
        }.bind(this)
      });
    } else {
      this.callback && this.callback(this.state);
    }
  },

  getState: function () {
    return this.state;
  },

  needsCheck: function () {
    return this.state === 'unknown' || this.state === 'checking';
  },

  isReady: function () {
    return this.state === 'ready';
  }
};

var instance;

module.exports = {
  get: function (configModel) {
    if (instance === undefined) {
      if (!configModel) throw new Error('configModel is required');
      instance = new DataServiceHealth(configModel);
    }
    return instance;
  }
};

