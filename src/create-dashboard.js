var _ = require('underscore');
var cdb = require('cartodb.js');
var DashboardView = require('./dashboard-view');
var WidgetsCollection = require('./widgets/widgets-collection');
var WidgetsService = require('./widgets-service');

/**
 * Translates a vizJSON v3 datastructure into a working dashboard which will be rendered in given selector.
 *
 * @param {String} selector e.g. "#foobar-id", ".some-class"
 * @param {Object} vizJSON JSON datastructure
 * @param {Object} opts (Optional) flags, see 3rd param for cdb.createVis for available ones. Keys used here:
 *   renderMenu: {Boolean} If true (default), render a top-level menu on the left side.
 * @return {Object} with keys:
 *   dashboardView: root (backbone) view of the dashboard
 *   vis: the instantiated vis map, same result as given from cdb.createVis()
 */
module.exports = function (selector, vizJSON, opts) {
  var dashboardEl = document.querySelector(selector);
  if (!dashboardEl) throw new Error('no element found with selector ' + selector);

  // Default options
  opts = opts || {};
  opts.renderMenu = _.isBoolean(opts.renderMenu)
    ? opts.renderMenu
    : true;

  var widgets = new WidgetsCollection();

  var model = new cdb.core.Model({
    title: vizJSON.title,
    description: vizJSON.description,
    updatedAt: vizJSON.updated_at,
    userName: vizJSON.user.fullname,
    userAvatarURL: vizJSON.user.avatar_url,
    renderMenu: opts.renderMenu
  });
  var dashboardView = new DashboardView({
    el: dashboardEl,
    widgets: widgets,
    model: model
  });
  var vis = cdb.createVis(dashboardView.$('#map'), vizJSON, opts);

  var widgetModelsMap = {
    list: widgetsService.addListWidget.bind(widgetsService),
    formula: widgetsService.addFormulaWidget.bind(widgetsService),
    histogram: widgetsService.addHistogramWidget.bind(widgetsService),
    'time-series': widgetsService.addTimeSeriesWidget.bind(widgetsService),
    category: widgetsService.addCategoryWidget.bind(widgetsService)
  };

  // Create the set of widgets through the widgetsService
  var widgetsService = new WidgetsService(widgets, vis.dataviews);
  vizJSON.widgets.forEach(function (rawWidgetData) {
    var layerId = rawWidgetData.layerId;
    var widgetAttrs = _.omit(rawWidgetData, 'options', 'layerId');

    // Find the Layer that the Widget should be created for.
    var layer;
    if (layerId) {
      layer = vis.map.layers.findWhere({ id: layerId });
    } else if (Number.isInteger(rawWidgetData.layerIndex)) {
      // TODO Since namedmap doesn't have ids we need to map in another way, here using index
      //   should we solve this in another way?
      layer = vis.map.layers.at(rawWidgetData.layerIndex);
    }

    var type = widgetAttrs.type;
    // Create widget model and add to the widgetsCollection.
    var addWidget = widgetModelsMap[type];
    if (_.isFunction(addWidget)) {
        addWidget(layer, widgetAttrs);
    } else {
      throw new Error('no widget type registered for type ' + type);
    }
  });

  dashboardView.render();

  return {
    dashboardView: dashboardView,
    widgets: widgetsService,
    vis: vis
  };
};
