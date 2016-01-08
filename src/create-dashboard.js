var _ = require('underscore');
var cdb = require('cartodb.js');
var DashboardView = require('./dashboard-view');
var WidgetModelFactory = require('./widgets/widget-model-factory');
var DataviewModelFactory = require('./dataview-model-factory');
var WidgetsCollection = require('./widgets/widgets-collection');
var WidgetModel = require('./widgets/widget-model');
var CategoryWidgetModel = require('./widgets/category/category-widget-model');

module.exports = function (selector, diJSON, visOpts) {
  var dashboardEl = document.querySelector(selector);
  if (!dashboardEl) throw new Error('no element found with selector ' + selector);

  var widgets = new WidgetsCollection();

  var dashboardInfoModel = new cdb.core.Model({
    title: diJSON.title,
    description: diJSON.description,
    updatedAt: diJSON.updated_at,
    userName: diJSON.user.fullname,
    userAvatarURL: diJSON.user.avatar_url
  });
  var dashboardView = new DashboardView({
    el: dashboardEl,
    widgets: widgets,
    dashboardInfoModel: dashboardInfoModel
  });
  var vis = cdb.createVis(dashboardView.$('#map'), diJSON.vizJSON, visOpts);

  var dataviewModelFactory = new DataviewModelFactory({
    list: function (attrs, layer) {
      return vis.dataviewsFactory.createListDataview(layer, attrs);
    },
    formula: function (attrs, layer) {
      return vis.dataviewsFactory.createFormulaDataview(layer, attrs);
    },
    histogram: function (attrs, layer) {
      return vis.dataviewsFactory.createHistogramDataview(layer, attrs);
    },
    // TODO: Rename type to category instead of aggregation?
    aggregation: function (attrs, layer) {
      return vis.dataviewsFactory.createCategoryDataview(layer, attrs);
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
  diJSON.widgets.forEach(function (widget) {
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
