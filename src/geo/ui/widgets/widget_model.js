
cdb.geo.ui.Widget.Model = cdb.core.Model.extend({

  bindDashboardInstance: function(dashboardInstance) {
    dashboardInstance.bind('change:layergroupid', function(dashboardInstance) {
      this.set({
        dashboardBaseURL: dashboardInstance.getBaseURL(),
        urls: dashboardInstance.getTiles()
      });
    }.bind(this));
  }
  
});
