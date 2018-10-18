var _ = require('underscore');

/**
 *  Create a class for providing the Deep Insights Helpers necessary
 *  for any implementation within deep-insights-integration.
 */

var diDashboardHelpers = function (deepInsightsDashboard) {
  this._deepInsightsDashboard = deepInsightsDashboard;
  return this;
};

_.extend(
  diDashboardHelpers.prototype,
  {
    visMap: function () {
      return this.getMap().map;
    },

    getMap: function () {
      return this.getDashboard().getMap();
    },

    moveCartoDBLayer: function (from, to) {
      this.visMap().moveCartoDBLayer(from, to);
    },

    reloadMap: function () {
      this.getDashboard().reloadMap();
    },

    invalidateMap: function () {
      this.getMap().reload();
    },

    forceResize: function () {
      this.getDashboard().forceResize();
    },

    setBounds: function (bounds) {
      this.getDashboard()._dashboard.vis.map.setBounds(bounds);
    },

    analyse: function (analysisDefinition) {
      return this.getMap().analysis.analyse(analysisDefinition);
    },

    getAnalysisByNodeId: function (nodeId) {
      return this.getMap().analysis.findNodeById(nodeId);
    },

    getLayer: function (id) {
      return this.visMap().getLayerById(id);
    },

    getLayers: function () {
      return this.visMap().layers;
    },

    getWidget: function (id) {
      return this.getDashboard().getWidget(id);
    },

    getWidgets: function () {
      return this.getDashboard().getWidgets();
    },

    getOverlays: function () {
      return this.getMap().overlaysCollection;
    },

    getDashboard: function () {
      return this._deepInsightsDashboard;
    }
  }
);

module.exports = diDashboardHelpers;
