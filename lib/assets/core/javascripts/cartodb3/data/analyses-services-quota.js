var _ = require('underscore');
var Backbone = require('backbone');
var cdb = require('cartodb.js');

var SERVICE_QUOTA_QUERY = 'select * from cdb_dataservices_client.cdb_service_quota_info();';
var ENOUGH_QUOTA_QUERY = _.template("select cdb_dataservices_client.cdb_enough_quota('<%= analysis %>', <%= quota %>);");

var AnalysesQuota = {
  initialize: function (options) {
    if (!options || !options.configModel) throw new Error('configModel is required');

    this.configModel = options.configModel;
    this.SQL = new cdb.SQL({
      user: this.configModel.get('user_name'),
      sql_api_template: this.configModel.get('sql_api_template'),
      api_key: this.configModel.get('api_key')
    });

    this.serviceQuotasCollection = new Backbone.Collection();

    return this;
  },

  getAllQuotas: function () {
    this.SQL.execute(SERVICE_QUOTA_QUERY, null, {
      success: function (data) {
        this.serviceQuotasCollection.reset(data.rows);
      }.bind(this),
      error: function (error) {
        var userName = this.configModel.get('user_name');
        console.error('An error ocurred trying to get the quotas for user ' + userName + ': ' + error);
      }.bind(this)
    });
  },

  getServiceQuota: function (service) {
    return this.serviceQuotasCollection.findWhere({service: service});
  },

  isEnoughQuota: function (service, callback) {
    // callback function must be an error-first node style callback
    var serviceQuota = this.getServiceQuota(service);

    if (!serviceQuota) {
      callback(null, true);
    }

    var monthlyQuota = serviceQuota.get('monthly_quota');
    var remainQuota = serviceQuota.get('user_quota');
    var quota = Math.max(0, monthlyQuota - remainQuota);
    var query = ENOUGH_QUOTA_QUERY({
      analysis: service,
      quota: quota
    });

    this.SQL.execute(query, null, {
      success: function (data) {
        callback(null, data);
      },
      error: function (err) {
        callback({
          errorType: 'quotaEnoughError',
          message: 'Quota for service ' + service + ' raised an error: ' + err
        });
      }
    });
  }
};

module.exports = AnalysesQuota;
