var _ = cdb._;
var Model = cdb.core.Model;
var log = cdb.log;
var DashboardView = require('./dashboard-view');
var WidgetsCollection = require('./widgets/widgets-collection');
var WidgetModelFactory = require('./widgets/widget-model-factory');
var ListModel = require('./widgets/list/model');
var HistogramModel = require('./widgets/histogram/model');
var CategoryModel = require('./widgets/category/model');
var FormulaModel = require('./widgets/formula/model');
var RangeFilter = require('./windshaft/filters/range');
var CategoryFilter = require('./windshaft/filters/category');
var WindshaftConfig = require('./windshaft/config');
var WindshaftClient = require('./windshaft/client');
var WindshaftDashboard = require('./windshaft/dashboard');
var WindshaftPrivateDashboardConfig = require('./windshaft/private-dashboard-config');
var WindshaftPublicDashboardConfig = require('./windshaft/public-dashboard-config');

module.exports = function(selector, diJSON, visOpts) {
  var widgetModelFactory = new WidgetModelFactory({
    list: function(attrs, opts) {
      return new ListModel(attrs, opts);
    },
    formula: function(attrs, opts) {
      return new FormulaModel(attrs, opts);
    },
    histogram: function(attrs, opts, layerIndex) {
      opts.filter = new RangeFilter({
        widgetId: attrs.id,
        layerIndex: layerIndex
      });
      return new HistogramModel(attrs, opts);
    },
    'time-series': function(attrs, opts, layerIndex) {
      // change type because time-series because it's really a histogram (for the tiler at least)
      attrs.type = 'histogram';
      opts.filter = new RangeFilter({
        widgetId: attrs.id,
        layerIndex: layerIndex
      });
      var model = new HistogramModel(attrs, opts);

      // since we changed the type of we need some way to identify that it's intended for a time-series view later
      model.isForTimeSeries = true;

      return model;
    },
    aggregation: function(attrs, opts, layerIndex) {
      opts.filter = new CategoryFilter({
        widgetId: attrs.id,
        layerIndex: layerIndex
      });
      return new CategoryModel(attrs, opts);
    }
  });

  // TODO keep this collection in sync with layers individual widgets collections
  var widgets = new WidgetsCollection();

  var dashboardInfoModel = new Model({
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
  vis.map.layers.each(function(layer) {
    var layerType = layer.get('type');
    var isLayerGroup = layerType === 'layergroup';

    if (isLayerGroup) {
      cartoDBLayerGroup = layer;
    }

    if (isLayerGroup || layerType === 'namedmap') {
      layer.layers.each(function(subLayer) {
        interactiveLayers.push(subLayer);
      });
    } else {
       if (layerType === 'torque') {
        interactiveLayers.push(layer);
       }
    }
  });

  // TODO: We can probably move this logic somewhere else
  var widgetModels = [];
  for (var id in diJSON.widgets) {
    var d = diJSON.widgets[id];
    var layer;

    // Find the Layer that the Widget should be created for.
    // a layerId has top-priority, otherwise it tries with a layerIndex, and even a subLayerIndex (if available)
    if (d.layerId) {
      layer = _.find(interactiveLayers, function(l) {
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
      var attrs = _.extend({
        id: id
      }, d);
      var widgetModel = widgetModelFactory.createModel(layer, layerIndex, attrs);
      widgetModels.push(widgetModel);
    } else {
      log.error('no layer found for widget ' + id + ':'  + JSON.stringify(d));
    }
  }
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

  var dashboard = new WindshaftDashboard({
    client: windshaftClient,
    configGenerator: configGenerator,
    statTag: datasource.stat_tag,
    //TODO: assuming here all viz.json has a layergroup and that may not be true
    layerGroup: cartoDBLayerGroup,
    layers: interactiveLayers,
    widgets: widgets,
    map: vis.map
  });

  // TODO: rethink this
  if (widgets.size() > 0) {
    setTimeout(function() {
      vis.mapView.invalidateSize();
    }, 0);
  }

  return dashboardView;
};
