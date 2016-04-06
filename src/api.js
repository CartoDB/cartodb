var _ = require('underscore');
var createDashboard = require('./create-dashboard');
var cdb = require('cartodb.js');

function Dashboard (dashboard) {
  this.dashboard = dashboard;
}

Dashboard.prototype = {

  /**
   * @return {Map} the map used in the dashboard
   */
  getMap: function () {
    return this.dashboard.vis;
  },

  /**
   * @return {Array} of widgets in the dashboard
   */
  getWidgets: function () {
    return this.dashboard.widgets.getList();
  },

  /**
   * @param {Integer} id - widget id
   * @return a widget object
   */
  getWidget: function (id) {
    return this.dashboard.widgets.get(id);
  },

  /**
   * Create a category widget.
   * @param {Object} widgetAttrs - attributes for the new widget
   * @param {string} widgetAttrs.id - id (required)
   * @param {string} widgetAttrs.title - title (required)
   * @param {number} widgetAttrs.order - index of the widget (optional)
   * @param ...
   * @return {CategoryWidget} The new widget
   */
  createCategoryWidget: function (widgetAttrs, layer) {
    return this.dashboard.widgets.createCategoryModel(widgetAttrs, layer);
  },

  /**
   * Create a histogram widget
   * @param {Object} widgetAttrs - attributes for the new widget
   * @param {string} widgetAttrs.id - id (required)
   * @param {string} widgetAttrs.title - title (required)
   * @param {number} widgetAttrs.order - index of the widget (optional)
   * @param ...
   * @return {HistogramWidget} The new widget
   */
  createHistogramWidget: function (widgetAttrs, layer) {
    return this.dashboard.widgets.createHistogramModel(widgetAttrs, layer);
  },

  /**
   * Create a formula widget
   * @param {Object} widgetAttrs - attributes for the new widget
   * @param {string} widgetAttrs.id - id (required)
   * @param {string} widgetAttrs.title - title (required)
   * @param {number} widgetAttrs.order - index of the widget (optional)
   * @param ...
   * @return {FormulaWidget} The new widget
   */
  createFormulaWidget: function (widgetAttrs, layer) {
    return this.dashboard.widgets.createFormulaModel(widgetAttrs, layer);
  },

  /**
   * Create a timesier es widget
   * @param {Object} widgetAttrs - attributes for the new widget
   * @param {string} widgetAttrs.id - id (required)
   * @param {string} widgetAttrs.title - title (required)
   * @param {number} widgetAttrs.order - index of the widget (optional)
   * @param ...
   * @return {TimeSeriesWidget} The new widget
   */
  createTimeSeriesWidget: function (widgetAttrs, layer) {
    return this.dashboard.widgets.createTimeSeriesModel(widgetAttrs, layer);
  }

};

module.exports = function (selector, vizJSON, opts, callback) {
  var args = arguments;
  var fn = args[args.length - 1];

  if (_.isFunction(fn)) {
    callback = fn;
  }

  function _load (vizJSON) {
    var dashboard = createDashboard(selector, vizJSON, opts);
    dashboard.vis.done(function () {
      callback && callback(null, new Dashboard(dashboard));
    });
  }

  if (typeof vizJSON === 'string') {
    cdb.core.Loader.get(vizJSON, function (data) {
      if (data) {
        _load(data, opts);
      } else {
        callback && callback(new Error('error fetching viz.json file'));
      }
    });
  } else {
    _load(vizJSON, opts);
  }
};

