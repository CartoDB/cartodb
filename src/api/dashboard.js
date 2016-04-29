var URLHelper = require('./url-helper');
var _ = require('underscore');

function Dashboard (dashboard) {
  this._dashboard = dashboard;
}

Dashboard.prototype = {

  /**
   * @return {Map} the map used in the dashboard
   */
  getMap: function () {
    return this._dashboard.vis;
  },

  /**
   * @return {Array} of widgets in the dashboard
   */
  getWidgets: function () {
    return this._dashboard.widgets.getList();
  },

  getDashboardURL: function () {
    return URLHelper.getURLFromState(this.getState());
  },

  getState: function () {
    var widgetsState = this._dashboard.widgets._widgetsCollection.getStates();
    var mapState = {}; // TODO
    return _.extend(mapState, widgetsState);
  },

  setState: function (state) {
    // todo: set map state
    this._dashboard.widgets.setWidgetsState(state);
  },

  /**
   * @param {Integer} id - widget id
   * @return a widget object
   */
  getWidget: function (id) {
    return this._dashboard.widgets.get(id);
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
    return this._dashboard.widgets.createCategoryModel(widgetAttrs, layer);
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
    return this._dashboard.widgets.createHistogramModel(widgetAttrs, layer);
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
    return this._dashboard.widgets.createFormulaModel(widgetAttrs, layer);
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
    return this._dashboard.widgets.createTimeSeriesModel(widgetAttrs, layer);
  }

};

module.exports = Dashboard;
