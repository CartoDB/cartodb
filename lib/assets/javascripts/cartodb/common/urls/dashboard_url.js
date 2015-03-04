/**
 * URLs associated with the dashboard.
 */
cdb.common.DashboardUrl = cdb.common.Url.extend({

  datasets: function() {
    return new cdb.common.DashboardDatasetsUrl({
      base_url: this.toPath('datasets')
    });
  },

  maps: function() {
    return new cdb.common.DashboardVisUrl({
      base_url: this.toPath('maps')
    });
  }
});
