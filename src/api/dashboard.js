var URLHelper = require('./url-helper');
var _ = require('underscore');

function Dashboard (dashboard) {
  this._dashboard = dashboard;

  this.onDataviewsFetched(function () {
    dashboard.widgets._widgetsCollection.initialState();
    dashboard.widgets._widgetsCollection.each(function (m) {
      m && m.applyInitialState && m.applyInitialState();
    });
  });
}

Dashboard.prototype = {

  /**
   * @return {View} used in the dashboard
   */
  getView: function () {
    return this._dashboard.dashboardView;
  },

  /**
   * @return {Map} the map used in the dashboard
   */
  getMap: function () {
    return this._dashboard.vis;
  },

  reloadMap: function () {
    this.getMap().reload();
  },

  forceResize: function () {
    this._dashboard.widgets.getCollection()
      .each(function (widget) {
        widget.forceResize();
      });
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
    var state = {};
    var mapState = this.getMapState();
    if (!_.isEmpty(mapState)) state.map = mapState;

    var widgetsCollection = this._dashboard.widgets.getCollection();
    var widgetsState = widgetsCollection.getStates();
    if (!_.isEmpty(widgetsState)) state.widgets = widgetsState;
    return state;
  },

  getMapState: function () {
    var map = this._dashboard.vis.map;
    var currentBoundingBox = map.getViewBounds();
    var center = map.get('center');
    var zoom = map.get('zoom');

    return {
      ne: currentBoundingBox[0],
      sw: currentBoundingBox[1],
      center: center,
      zoom: zoom
    };
  },

  setState: function (state) {
    // todo: set map state
    this._dashboard.widgets.setWidgetsState(state.widgets);
    this._dashboard.vis.mapvis.map.setBounds([state.map.ne, state.map.sw]);
  },

  onDataviewsFetched: function (callback) {
    var areWidgetsInitialized = this._dashboard.areWidgetsInitialised();
    if (areWidgetsInitialized) {
      callback && callback();
    } else {
      this._dashboard.vis.once('dataviewsFetched', function () {
        callback && callback();
      });
    }
  },

  onStateChanged: function (callback) {
    this.onDataviewsFetched(function () {
      callback && this._bindChange(callback);
    }.bind(this));
  },

  _bindChange: function (callback) {
    var widgetsCollection = this._dashboard.widgets.getCollection();
    widgetsCollection.bind('change', function () {
      callback(this.getState(), this.getDashboardURL());
    }, this);

    this._dashboard.vis.map.bind('change', function () {
      callback(this.getState(), this.getDashboardURL());
    }, this);
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
    return this._dashboard.widgets.createCategoryModel(widgetAttrs, layer, null);
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
    return this._dashboard.widgets.createHistogramModel(widgetAttrs, layer, null);
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
    return this._dashboard.widgets.createFormulaModel(widgetAttrs, layer, null);
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
    return this._dashboard.widgets.createTimeSeriesModel(widgetAttrs, layer, null);
  }

};

module.exports = Dashboard;
