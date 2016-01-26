var _ = require('underscore');
var cdb = require('cartodb.js');
var DashboardView = require('./dashboard-view');
var WidgetModelFactory = require('./widgets/widget-model-factory');
var DataviewModelFactory = require('./dataview-model-factory');
var WidgetsCollection = require('./widgets/widgets-collection');
var WidgetModel = require('./widgets/widget-model');
var CategoryWidgetModel = require('./widgets/category/category-widget-model');

/**
 * Translates a vizJSON v3 datastructure into a working dashboard which will be rendered in given selector.
 *
 * @param {String} selector e.g. "#foobar-id", ".some-class"
 * @param {Object} vizJSON JSON datastructure
 * @param {Object} opts (Optional) flags, see 3rd param for cdb.createVis for available ones.
 * @return {Object} with keys:
 *   dashboardView: root (backbone) view of the dashboard
 *   vis: the instantiated vis map, same result as given from cdb.createVis()
 */
module.exports = function (selector, vizJSON, opts) {
  var dashboardEl = document.querySelector(selector);
  if (!dashboardEl) throw new Error('no element found with selector ' + selector);

  var widgets = new WidgetsCollection();

  var dashboardInfoModel = new cdb.core.Model({
    title: vizJSON.title,
    description: vizJSON.description,
    updatedAt: vizJSON.updated_at,
    userName: vizJSON.user.fullname,
    userAvatarURL: vizJSON.user.avatar_url
  });
  var dashboardView = new DashboardView({
    el: dashboardEl,
    widgets: widgets,
    dashboardInfoModel: dashboardInfoModel
  });
  var vis = cdb.createVis(dashboardView.$('#map'), vizJSON, opts);

  var dataviewModelFactory = new DataviewModelFactory({
    list: function (attrs, layer) {
      return vis.dataviews.createListDataview(layer, attrs);
    },
    formula: function (attrs, layer) {
      return vis.dataviews.createFormulaDataview(layer, attrs);
    },
    histogram: function (attrs, layer) {
      return vis.dataviews.createHistogramDataview(layer, attrs);
    },
    // TODO: Rename type to category instead of aggregation?
    aggregation: function (attrs, layer) {
      return vis.dataviews.createCategoryDataview(layer, attrs);
    }
  });

  var widgetModelFactory = new WidgetModelFactory({
    list: function (widgetAttrs, widgetOpts) {
      return new WidgetModel(widgetAttrs, widgetOpts);
    },
    formula: function (widgetAttrs, widgetOpts) {
      return new WidgetModel(widgetAttrs, widgetOpts);
    },
    histogram: function (widgetAttrs, widgetOpts) {
      return new WidgetModel(widgetAttrs, widgetOpts);
    },
    'time-series': function (widgetAttrs, widgetOpts) {
      return new WidgetModel(widgetAttrs, widgetOpts);
    },
    category: function (widgetAttrs, widgetOpts) {
      return new CategoryWidgetModel(widgetAttrs, widgetOpts);
    }
  });

  // TODO: We can probably move this logic somewhere else
  var widgetModels = [];
  vizJSON.widgets.forEach(function (widget) {
    var widgetAttrs = _.omit(widget, 'dataview');

    // Create dataview if there's a definition provided
    var dataviewModel;
    var d = widget.dataview;
    if (d) {
      var layer;

      // Find the Layer that the Widget should be created for.
      // a layerId has top-priority, otherwise it tries with a layerIndex, and even a subLayerIndex (if available)
      if (d.layerId) {
        layer = vis.interactiveLayers.find(function (m) {
          return d.layerId === m.get('id');
        });
      } else if (Number.isInteger(d.layerIndex)) {
        layer = vis.map.layers.at(d.layerIndex);
        if (layer && Number.isInteger(d.subLayerIndex)) {
          layer = layer.layers.at(d.subLayerIndex);
        }
      }

      if (layer) {
        // TODO the layerIndex could change when layers are added/removed, which would introduce unexpected bugs
        var layerIndex = vis.interactiveLayers.indexOf(layer);
        dataviewModel = dataviewModelFactory.createModel(d, layer, layerIndex);
      } else {
        cdb.log.error('no layer found for dataview ' + JSON.stringify(d));
      }
    }

    var widgetOpts = {
      dataviewModel: dataviewModel
    };
    var widgetModel = widgetModelFactory.createModel(widgetAttrs, widgetOpts);
    widgetModels.push(widgetModel);
  });

  widgets.reset(widgetModels);
  dashboardView.render();

  return {
    dashboardView: dashboardView,
    vis: vis
  };
};
