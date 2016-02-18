var $ = require('jquery');
var _ = require('underscore');
var cdb = require('cartodb-deep-insights.js');
var Polyglot = require('node-polyglot');
var ConfigModel = require('./data/config-model');
var EditorMapView = require('./editor/map/map-view');
var LayerDefinitionsCollection = require('./data/layer-definitions-collection');
var MapDefinitionModel = require('./data/map-definition-model');
var VisDefinitionModel = require('./data/vis-definition-model');
var WidgetDefinitionModel = require('./data/widget-definition-model');
var TabPaneViewFactory = require('./components/tab-pane/tab-pane-factory');
var EditorPaneTemplate = require('./editor-pane.tpl');
var ModalsServiceModel = require('./components/modals/modals-service-model');
var viewFactory = require('./components/view-factory');

// JSON data passed from entry point (editor/visualizations/show.html):
var vizJSON = window.vizJSON;
var userData = window.userData;
var frontendConfig = window.frontendConfig;
var visualizationData = window.visualizationData;
var layersData = window.layersData;

// Setup root and top-level models and objects
var ACTIVE_LOCALE = 'en';
var Locale = require('../../locale/index');
var polyglot = new Polyglot({
  locale: ACTIVE_LOCALE, // Needed for pluralize behaviour
  phrases: Locale[ACTIVE_LOCALE]
});

window._t = polyglot.t.bind(polyglot);

// Setup and create the vis (map, layers etc.) + dashboard (widgets) from the given vizJSON
// Remove old zoom template in order to start using new component
// TODO: decide how to manage this problem
delete vizJSON.overlays[2].template; // Zoom template
var dashboard = cdb.deepInsights.createDashboard('#dashboard', vizJSON, {
  no_cdn: false,
  cartodb_logo: false,
  renderMenu: false
});

var configModel = new ConfigModel(
  _.extend(
    {
      base_url: userData.base_url
    },
    frontendConfig
  )
);

var layerDefinitionsCollection = new LayerDefinitionsCollection(layersData, {
  configModel: configModel,
  mapId: visualizationData.map_id,
  layersCollection: dashboard.vis.map.layers
});
var mapDefinitionModel = new MapDefinitionModel({id: visualizationData.map_id}, {
  configModel: configModel,
  layerDefinitionsCollection: layerDefinitionsCollection
});
var visDefinitionModel = new VisDefinitionModel(visualizationData, {
  configModel: configModel,
  mapDefinitionModel: mapDefinitionModel
});
var widgetDefinitionsCollection = visDefinitionModel.widgetDefinitionsCollection;

// TODO should we provide a dashboard.done of some sort?
dashboard.vis.done(function () {
  layerDefinitionsCollection.each(function (layerDefModel) {
    var layerModel = dashboard.vis.map.layers.get(layerDefModel.id);
    layerDefModel.layerModel = layerModel;
  });

  vizJSON.widgets.forEach(function (d) {
    var layerDefModel = layerDefinitionsCollection.get(d.layer_id);
    var widgetDefModel = new WidgetDefinitionModel(d, {
      configModel: configModel,
      layerDefinitionModel: layerDefModel,
      dashboardWidgetsService: dashboard.widgets,
      widgetModel: dashboard.widgets.get(d.id)
    });
    widgetDefinitionsCollection.add(widgetDefModel);
  });
})
.error(function (err) {
  console.error(err);
});

var modals = new ModalsServiceModel();

var editorTabPaneView = TabPaneViewFactory.createWithIcons([
  {
    icon: 'dashboard',
    createContentView: function () {
      return viewFactory.createByHTML('Dashboard TBD');
    }
  }, {
    icon: 'map',
    selected: true,
    createContentView: function () {
      return new EditorMapView({
        modals: modals,
        visDefinitionModel: visDefinitionModel,
        layerDefinitionsCollection: layerDefinitionsCollection
      });
    }
  }], {
    tabPaneOptions: {
      className: 'Editor-wrapper',
      template: EditorPaneTemplate
    }
  });

$('.js-editor').prepend(editorTabPaneView.render().$el);

// Expose the root stuff to be able to inspect and modify state from developer console
visDefinitionModel.dashboard = dashboard;
window.viewFactory = viewFactory;
window.modals = modals;
window.configModel = configModel;
window.dashboard = dashboard;
window.vis = dashboard.vis;
window.visDefinitionModel = visDefinitionModel;
window.WidgetDefinitionModel = WidgetDefinitionModel;
window.widgetDefinitionsCollection = widgetDefinitionsCollection;
