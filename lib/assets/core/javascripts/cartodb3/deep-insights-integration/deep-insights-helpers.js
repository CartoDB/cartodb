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
      this.visMap.moveCartoDBLayer(from, to);
    },

    reloadMap: function () {
      this.getDashboard().reloadMap();
    },

    invalidateMap: function () {
      this.getMap().reload();
    },

    setBounds: function (bounds) {
      this.getDashboard()._dashboard.vis.map.setBounds(bounds);
    },

    getAnalysis: function (nodeId) {
      return this.getMap().analysis.findWhere({ id: nodeId });
    },

    getAnalyses: function () {
      return this.getMap().analysis;
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

    getDashboard: function () {
      return this._deepInsightsDashboard;
    }
  }
);

module.exports = diDashboardHelpers;
