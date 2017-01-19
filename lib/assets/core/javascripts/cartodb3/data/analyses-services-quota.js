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
      error: function (err) {
        var response = JSON.parse(err.responseText);
        console.error('An error ocurred trying to get the quotas: ' + response.error);
      }
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
    var remainQuota = serviceQuota.get('used_quota');
    var quota = Math.max(0, monthlyQuota - remainQuota);
    var query = ENOUGH_QUOTA_QUERY({
      analysis: service,
      quota: quota
    });

    this.SQL.execute(query, null, {
      success: function (data) {
        callback(data.rows[0].cdb_enough_quota);
      },
      error: function (err) {
        var response = JSON.parse(err.responseText);
        console.error('An error ocurred trying to check if the quota is enough for service ' + service + ': ' + response.error);
      }
    });
  }
};

module.exports = AnalysesQuota;
