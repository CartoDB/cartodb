var _ = require('underscore');
var cdb = require('cartodb-deep-insights.js');
var VisDefinitionModel = require('./data/vis-definition-model');
var WidgetDefinitionModel = require('./data/widget-definition-model');
var LayerDefinitionModel = require('./data/layer-definition-model');
var EditorWidgetsView = require('./editor/editor-widgets-view');
var Polyglot = require('node-polyglot');
var User = require('./data/user-model');
var ConfigModel = require('./data/config-model');
var TablesCollection = require('./data/tables-collection');
var TableModel = require('./data/table-model');

// JSON data passed from entry point (editor/visualizations/show.html):
var vizJSON = window.vizJSON;
var userData = window.userData;
var frontendConfig = window.frontendConfig;
var visualizationData = window.visualizationData;

// Setup root and top-level models and objects
var ACTIVE_LOCALE = 'en';
var Locale = require('../../locale/index');
var polyglot = new Polyglot({
  locale: ACTIVE_LOCALE, // Needed for pluralize behaviour
  phrases: Locale[ACTIVE_LOCALE]
});

cdb.T = polyglot.t.bind(polyglot);

var baseUrl = userData.base_url;
var configModel = new ConfigModel(frontendConfig);
var commonOpts = {
  baseUrl: baseUrl,
  configModel: configModel
};
var visDefinitionModel = new VisDefinitionModel(visualizationData, commonOpts);

var tableModels = visualizationData
  .related_tables
  .map(function (tableAttrs) {
    return new TableModel(tableAttrs, commonOpts);
  });
var tablesCollection = new TablesCollection(tableModels, commonOpts);
var userModel = new User(userData, {
  tablesCollection: tablesCollection
});

// Setup and create the vis (map, layers etc.) + dashboard (widgets) from the given vizJSON
// Remove old zoom template in order to start using new component
// TODO: decide how to manage this problem
delete vizJSON.overlays[2].template; // Zoom template
var dashboard = cdb.deepInsights.createDashboard('#dashboard', vizJSON, {
  no_cdn: false,
  cartodb_logo: false,
  renderMenu: false
});

// TODO should we provide a dashboard.done of some sort?
var layerDefinitionsCollection = visDefinitionModel.mapDefinitionModel.layerDefinitionsCollection;
dashboard.vis.done(function () {
  // TODO could be encapsulated elsewhere?
  _.each(vizJSON.layers, function (d) {
    var layersData = d.type === 'layergroup' || d.type === 'namedmap'
      ? d.options.layer_definition.layers
      : [d];
    _.each(layersData, function (d) {
      var layerDefModel = new LayerDefinitionModel(d, {
        layerModel: dashboard.vis.map.layers.get(d.id),
        tablesCollection: tablesCollection
      });
      layerDefinitionsCollection.add(layerDefModel);
    });
  });

  _.each(vizJSON.widgets, function (d) {
    var layerDefModel = layerDefinitionsCollection.get(d.layer_id);
    var widgetDefModel = new WidgetDefinitionModel(d, {
      layerDefinitionModel: layerDefModel,
      dashboardWidgetsService: dashboard.widgets,
      widgetModel: dashboard.widgets.get(d.id)
    });
    visDefinitionModel.widgetDefinitionsCollection.add(widgetDefModel);
  });
})
.error(function (err) {
  console.error(err);
});

// Setup root view
// TODO for now we only render widgets, but at some point this should be "wrapped" by a EditorView
var editorWidgetsView = new EditorWidgetsView({
  el: document.getElementsByClassName('js-panel'),
  collection: visDefinitionModel.widgetDefinitionsCollection,
  layerDefinitionsCollection: layerDefinitionsCollection
});
editorWidgetsView.render();

// Expose the root stuff to be able to inspect and modify state from developer console
visDefinitionModel.dashboard = dashboard;
window.configModel = configModel;
window.userModel = userModel;
window.dashboard = dashboard;
window.vis = dashboard.vis;
window.visDefinitionModel = visDefinitionModel;
window.WidgetDefinitionModel = WidgetDefinitionModel;
