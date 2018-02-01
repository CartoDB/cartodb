var DashboardVisUrlModel = require('dashboard/data/dashboard-vis-url-model');

/**
 * URL representing dashboard datasets
 */
var DashboardDatasetsUrlModel = DashboardVisUrlModel.extend({

  dataLibrary: function () {
    return this.urlToPath('library');
  }
});

module.exports = DashboardDatasetsUrlModel;
