var _ = require('underscore');
var Backbone = require('backbone');
var cdb = require('cartodb.js');
var DashboardView = require('./dashboard-view');
var DataviewsCollection = require('./dataviews/dataviews-collection');
var DataviewModelFactory = require('./dataviews/dataview-model-factory');
var WidgetModelFactory = require('./widgets/widget-model-factory');
var ListDataviewModel = require('./dataviews/list-dataview-model');
var HistogramDataviewModel = require('./dataviews/histogram-dataview-model');
var CategorDataviewModel = require('./dataviews/category-dataview-model');
var FormulaDataviewModel = require('./dataviews/formula-dataview-model');
var RangeFilter = require('./windshaft/filters/range');
var CategoryFilter = require('./windshaft/filters/category');
var WindshaftConfig = require('./windshaft/config');
var WindshaftClient = require('./windshaft/client');
var WindshaftDashboard = require('./windshaft/dashboard');
var WindshaftPrivateDashboardConfig = require('./windshaft/private-dashboard-config');
var WindshaftPublicDashboardConfig = require('./windshaft/public-dashboard-config');
var FormulaWidgetModel = require('./widgets/formula/formula-widget-model');
var HistogramWidgetModel = require('./widgets/histogram/histogram-widget-model');
var ListWidgetModel = require('./widgets/list/list-widget-model');
var TimeSeriesWidgetModel = require('./widgets/time-series/time-series-widget-model');
var CategoryWidgetModel = require('./widgets/category/category-widget-model');

module.exports = function (selector, diJSON, visOpts) {
  var dataviewModelFactory = new DataviewModelFactory({
    list: function (attrs, opts) {
      return new ListDataviewModel(attrs, opts);
    },
    formula: function (attrs, opts) {
      return new FormulaDataviewModel(attrs, opts);
    },
    histogram: function (attrs, opts) {
      opts.filter = new RangeFilter();
      return new HistogramDataviewModel(attrs, opts);
    },
    // TODO: Rename type to category instead of aggregation?
    aggregation: function (attrs, opts) {
      opts.filter = new CategoryFilter();
      return new CategorDataviewModel(attrs, opts);
    }
  });

  var widgetModelFactory = new WidgetModelFactory({
    list: function (widgetAttrs, widgetOpts) {
      return new ListWidgetModel(widgetAttrs, widgetOpts);
    },
    formula: function (widgetAttrs, widgetOpts) {
      return new FormulaWidgetModel(widgetAttrs, widgetOpts);
    },
    histogram: function (widgetAttrs, widgetOpts) {
      return new HistogramWidgetModel(widgetAttrs, widgetOpts);
    },
    'time-series': function (widgetAttrs, widgetOpts) {
      return new TimeSeriesWidgetModel(widgetAttrs, widgetOpts);
    },
    category: function (widgetAttrs, widgetOpts) {
      return new CategoryWidgetModel(widgetAttrs, widgetOpts);
    }
  });

  var widgets = new Backbone.Collection();

  var dashboardInfoModel = new cdb.core.Model({
    title: diJSON.title,
    description: diJSON.description,
    updatedAt: diJSON.updated_at,
    userName: diJSON.user.fullname,
    userAvatarURL: diJSON.user.avatar_url
  });
  var dashboardView = new DashboardView({
    el: document.querySelector(selector),
    widgets: widgets,
    dashboardInfoModel: dashboardInfoModel
  });

  var vis = cdb.createVis(dashboardView.$('#map'), diJSON.vizJSON, visOpts);

  var cartoDBLayerGroup;
  var interactiveLayers = [];
  vis.map.layers.each(function (layer) {
    var layerType = layer.get('type');
    var isLayerGroup = layerType === 'layergroup';

    if (isLayerGroup) {
      cartoDBLayerGroup = layer;
    }

    if (isLayerGroup || layerType === 'namedmap') {
      layer.layers.each(function (subLayer) {
        interactiveLayers.push(subLayer);
      });
    } else {
      if (layerType === 'torque') {
        interactiveLayers.push(layer);
      }
    }
  });

  // TODO: We can probably move this logic somewhere else
  var dataviews = new DataviewsCollection();
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
        layer = _.find(interactiveLayers, function (l) {
          return d.layerId === l.get('id');
        });
      } else if (Number.isInteger(d.layerIndex)) {
        layer = vis.map.layers.at(d.layerIndex);
        if (layer && Number.isInteger(d.subLayerIndex)) {
          layer = layer.layers.at(d.subLayerIndex);
        }
      }

      if (layer) {
        var layerIndex = interactiveLayers.indexOf(layer);
        dataviewModel = dataviewModelFactory.createModel(d, layer, layerIndex);
        dataviews.add(dataviewModel);
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

  // TODO: Perhaps this "endpoint" could be part of the "datasource"?
  var endpoint = WindshaftConfig.MAPS_API_BASE_URL;
  var configGenerator = WindshaftPublicDashboardConfig;
  var datasource = diJSON.datasource;
  // TODO: We can use something else to differentiate types of "datasource"s
  if (datasource.template_name) {
    endpoint = [WindshaftConfig.MAPS_API_BASE_URL, 'named', datasource.template_name].join('/');
    configGenerator = WindshaftPrivateDashboardConfig;
  }

  var windshaftClient = new WindshaftClient({
    endpoint: endpoint,
    urlTemplate: datasource.maps_api_template,
    userName: datasource.user_name,
    statTag: datasource.stat_tag,
    forceCors: datasource.force_cors
  });

  new WindshaftDashboard({ // eslint-disable-line
    client: windshaftClient,
    configGenerator: configGenerator,
    statTag: datasource.stat_tag,
    // TODO: assuming here all viz.json has a layergroup and that may not be true
    layerGroup: cartoDBLayerGroup,
    layers: interactiveLayers,
    dataviews: dataviews,
    map: vis.map
  });

  // TODO: rethink this
  if (dataviews.size() > 0) {
    setTimeout(function () {
      vis.mapView.invalidateSize();
    }, 0);
  }

  return {
    dashboardView: dashboardView,
    vis: vis
  };
};
