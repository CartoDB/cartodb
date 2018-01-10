var UrlModel = require('./url-model');
var DashboardVisUrlModel = require('./dashboard-vis-url-model');
var DashboardDatasetsUrlModel = require('./dashboard-datasets-url-model');
/**
 * URLs associated with the dashboard.
 */
var DashboardUrlModel = UrlModel.extend({

  datasets: function () {
    return new DashboardDatasetsUrlModel({
      base_url: this.urlToPath('datasets')
    });
  },

  maps: function () {
    return new DashboardVisUrlModel({
      base_url: this.urlToPath('maps')
    });
  },

  deepInsights: function () {
    return new DashboardVisUrlModel({
      base_url: this.urlToPath('deep-insights')
    });
  }
});

module.exports = DashboardUrlModel;
