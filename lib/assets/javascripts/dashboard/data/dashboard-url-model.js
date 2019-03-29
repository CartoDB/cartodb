var UrlModel = require('dashboard/data/url-model');
var DashboardVisUrlModel = require('dashboard/data/dashboard-vis-url-model');
var DashboardDatasetsUrlModel = require('dashboard/data/dashboard-datasets-url-model');
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
